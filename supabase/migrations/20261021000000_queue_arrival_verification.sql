-- SmartQueue arrival verification and no-show handling.
-- Apply after 20261020000000_smartqueue_baseline.sql.
-- Pending entries do not receive a token number and are not counted as waiting.
-- A server-validated QR check-in or authorized staff verification issues a token.

BEGIN;

ALTER TABLE public.queue_entries
  ADD COLUMN IF NOT EXISTS arrival_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS called_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz;

-- Configurable grace period per queue (default 3 minutes; permitted range 1-30).
ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS no_show_grace_minutes integer NOT NULL DEFAULT 3;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'queues_no_show_grace_minutes_range'
      AND conrelid = 'public.queues'::regclass
  ) THEN
    ALTER TABLE public.queues
      ADD CONSTRAINT queues_no_show_grace_minutes_range
      CHECK (no_show_grace_minutes BETWEEN 1 AND 30);
  END IF;
END;
$constraint$;

-- Pending verification requests must also prevent duplicate queue requests.
DROP INDEX IF EXISTS public.unique_active_queue_user;
CREATE UNIQUE INDEX unique_active_queue_user
  ON public.queue_entries (queue_id, user_id)
  WHERE status IN ('pending_verification', 'waiting', 'called');

CREATE INDEX IF NOT EXISTS idx_queue_entries_pending_verification
  ON public.queue_entries (queue_id, joined_at)
  WHERE status = 'pending_verification';

CREATE INDEX IF NOT EXISTS idx_queue_entries_called_at
  ON public.queue_entries (queue_id, called_at)
  WHERE status = 'called';

-- QR secrets are never directly readable by app users. The customer can only
-- submit a scanned code to verify_queue_arrival(); staff generate codes via RPC.
CREATE TABLE IF NOT EXISTS public.queue_checkin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES public.queues(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

ALTER TABLE public.queue_checkin_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.queue_checkin_codes FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.queue_checkin_codes TO service_role;

-- Joining creates a pending request. Pending users are deliberately excluded
-- from queue position calculations and from the admin's waiting count.
CREATE OR REPLACE FUNCTION public.join_queue_secure(p_queue_id uuid)
 RETURNS TABLE(
   entry_id uuid,
   queue_id uuid,
   token_number integer,
   entry_status text,
   people_ahead bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_queue_status text;
  v_entry_id uuid;
  v_token integer;
  v_status text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_queue_id IS NULL THEN
    RAISE EXCEPTION 'Queue ID is required';
  END IF;

  SELECT q.status INTO v_queue_status
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue not found';
  END IF;

  SELECT qe.id, qe.token_number, qe.status
    INTO v_entry_id, v_token, v_status
  FROM public.queue_entries qe
  WHERE qe.queue_id = p_queue_id
    AND qe.user_id = v_user_id
    AND qe.status IN ('pending_verification', 'waiting', 'called')
  ORDER BY qe.joined_at DESC
  LIMIT 1;

  IF v_entry_id IS NULL THEN
    IF v_queue_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'Queue is not active';
    END IF;

    -- Do not allocate a token until arrival is verified. This prevents pending
    -- requests from reserving queue order or jumping ahead of checked-in users.
    INSERT INTO public.queue_entries (
      queue_id, user_id, token_number, status
    ) VALUES (
      p_queue_id, v_user_id, NULL, 'pending_verification'
    )
    RETURNING id, status INTO v_entry_id, v_status;

    v_token := NULL;
  END IF;

  RETURN QUERY
  SELECT v_entry_id, p_queue_id, v_token, v_status,
    (
      SELECT COUNT(*)::bigint
      FROM public.queue_entries qe
      WHERE qe.queue_id = p_queue_id
        AND qe.status IN ('waiting', 'called')
        AND qe.token_number < v_token
    );
END;
$function$;

-- Staff QR codes are short lived (5 minutes) and previous codes are revoked
-- whenever a new code is generated for the same queue.
CREATE OR REPLACE FUNCTION public.admin_create_queue_checkin_code(p_queue_id uuid)
 RETURNS TABLE(checkin_code text, expires_at timestamptz)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_queue_status text;
  v_code text;
  v_expires_at timestamptz;
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  SELECT q.status INTO v_queue_status
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue not found';
  END IF;
  IF v_queue_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Queue must be active to issue a check-in code';
  END IF;

  UPDATE public.queue_checkin_codes c
  SET revoked_at = now()
  WHERE c.queue_id = p_queue_id
    AND c.revoked_at IS NULL
    AND c.expires_at > now();

  v_code := gen_random_uuid()::text;
  v_expires_at := now() + interval '5 minutes';

  INSERT INTO public.queue_checkin_codes (
    queue_id, code, created_by, expires_at
  ) VALUES (
    p_queue_id, v_code, auth.uid(), v_expires_at
  );

  RETURN QUERY SELECT v_code, v_expires_at;
END;
$function$;

-- Customer submits the queue ID and opaque code read from the on-site QR.
-- The server checks expiry/revocation and activates only their own pending entry.
CREATE OR REPLACE FUNCTION public.verify_queue_arrival(
  p_queue_id uuid,
  p_code text
)
 RETURNS TABLE(
   entry_id uuid,
   queue_id uuid,
   token_number integer,
   entry_status text,
   people_ahead bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_queue_status text;
  v_entry_id uuid;
  v_token integer;
  v_status text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_queue_id IS NULL OR p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RAISE EXCEPTION 'A valid queue QR code is required';
  END IF;

  -- Serialize token assignment with other arrivals and staff queue actions.
  SELECT q.status INTO v_queue_status
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF NOT FOUND OR v_queue_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Queue is not active';
  END IF;

  PERFORM 1
  FROM public.queue_checkin_codes c
  WHERE c.queue_id = p_queue_id
    AND c.code = trim(p_code)
    AND c.revoked_at IS NULL
    AND c.expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This check-in QR is invalid or expired. Ask staff for the current QR code.';
  END IF;

  SELECT qe.id, qe.token_number, qe.status
  INTO v_entry_id, v_token, v_status
  FROM public.queue_entries qe
  WHERE qe.queue_id = p_queue_id
    AND qe.user_id = v_user_id
    AND qe.status IN ('pending_verification', 'waiting', 'called')
  ORDER BY qe.joined_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending queue request found for your account';
  END IF;

  IF v_status = 'pending_verification' THEN
    UPDATE public.queues q
    SET current_token = GREATEST(
      COALESCE(q.current_token, 0),
      COALESCE((
        SELECT MAX(qe.token_number)
        FROM public.queue_entries qe
        WHERE qe.queue_id = p_queue_id
      ), 0)
    ) + 1
    WHERE q.id = p_queue_id
    RETURNING q.current_token INTO v_token;

    UPDATE public.queue_entries qe
    SET status = 'waiting',
        token_number = v_token,
        arrival_verified_at = now()
    WHERE qe.id = v_entry_id
    RETURNING qe.status INTO v_status;
  END IF;

  RETURN QUERY
  SELECT v_entry_id, p_queue_id, v_token, v_status,
    (
      SELECT COUNT(*)::bigint
      FROM public.queue_entries qe
      WHERE qe.queue_id = p_queue_id
        AND qe.status IN ('waiting', 'called')
        AND qe.token_number < v_token
    );
END;
$function$;

-- Allow customers to cancel their own pending, waiting, or called entry.
CREATE OR REPLACE FUNCTION public.cancel_my_queue_entry(p_queue_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_entry_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT qe.id INTO v_entry_id
  FROM public.queue_entries qe
  WHERE qe.queue_id = p_queue_id
    AND qe.user_id = v_user_id
    AND qe.status IN ('pending_verification', 'waiting', 'called')
  ORDER BY qe.joined_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No cancellable queue entry found';
  END IF;

  UPDATE public.queue_entries qe
  SET status = 'cancelled',
      cancelled_at = now()
  WHERE qe.id = v_entry_id;

  RETURN 'cancelled';
END;
$function$;

-- List requests awaiting on-site verification for the authenticated queue owner.
CREATE OR REPLACE FUNCTION public.admin_list_pending_entries(p_queue_id uuid)
 RETURNS TABLE(
   entry_id uuid,
   token_number integer,
   customer_name text,
   joined_at timestamptz
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  RETURN QUERY
  SELECT qe.id,
         qe.token_number,
         COALESCE(
           NULLIF(u.name, ''),
           NULLIF(split_part(COALESCE(u.email, ''), '@', 1), ''),
           'Customer'
         ),
         qe.joined_at
  FROM public.queue_entries qe
  LEFT JOIN public.users u ON u.id = qe.user_id
  WHERE qe.queue_id = p_queue_id
    AND qe.status = 'pending_verification'
  ORDER BY qe.joined_at ASC;
END;
$function$;

-- Staff may manually verify the person after checking them at the desk.
CREATE OR REPLACE FUNCTION public.admin_verify_pending_entry(p_entry_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_queue_id uuid;
  v_queue_status text;
  v_token integer;
BEGIN
  SELECT qe.queue_id INTO v_queue_id
  FROM public.queue_entries qe
  WHERE qe.id = p_entry_id
    AND qe.status = 'pending_verification'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending verification entry not found';
  END IF;
  IF NOT public.can_manage_queue(v_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  SELECT q.status INTO v_queue_status
  FROM public.queues q
  WHERE q.id = v_queue_id
  FOR UPDATE;

  IF v_queue_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Queue must be active to verify arrival';
  END IF;

  UPDATE public.queues q
  SET current_token = GREATEST(
    COALESCE(q.current_token, 0),
    COALESCE((
      SELECT MAX(qe.token_number)
      FROM public.queue_entries qe
      WHERE qe.queue_id = v_queue_id
    ), 0)
  ) + 1
  WHERE q.id = v_queue_id
  RETURNING q.current_token INTO v_token;

  UPDATE public.queue_entries
  SET status = 'waiting',
      token_number = v_token,
      arrival_verified_at = now()
  WHERE id = p_entry_id;

  RETURN 'waiting';
END;
$function$;

-- Staff can reject an invalid pending request. It remains in history.
CREATE OR REPLACE FUNCTION public.admin_reject_pending_entry(p_entry_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_queue_id uuid;
BEGIN
  SELECT qe.queue_id INTO v_queue_id
  FROM public.queue_entries qe
  WHERE qe.id = p_entry_id
    AND qe.status = 'pending_verification'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending verification entry not found';
  END IF;
  IF NOT public.can_manage_queue(v_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  UPDATE public.queue_entries
  SET status = 'rejected',
      cancelled_at = now()
  WHERE id = p_entry_id;

  RETURN 'rejected';
END;
$function$;

-- Staff can explicitly mark the currently called customer as a no-show.
CREATE OR REPLACE FUNCTION public.admin_mark_current_no_show(p_queue_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_token integer;
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  SELECT qe.token_number INTO v_token
  FROM public.queue_entries qe
  WHERE qe.queue_id = p_queue_id
    AND qe.status = 'called'
  ORDER BY qe.token_number ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No currently called token to mark as no-show';
  END IF;

  UPDATE public.queue_entries
  SET status = 'no_show',
      no_show_at = now()
  WHERE queue_id = p_queue_id
    AND status = 'called'
    AND token_number = v_token;

  RETURN v_token;
END;
$function$;

-- Backend-time-based grace period: the queue's no_show_grace_minutes setting
-- defaults to 3 (range 1-30). Expiry runs when the admin dashboard refreshes
-- or calls next; no background cron job is assumed by this migration.
CREATE OR REPLACE FUNCTION public.admin_expire_no_shows(p_queue_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  UPDATE public.queue_entries
  SET status = 'no_show',
      no_show_at = now()
  WHERE queue_id = p_queue_id
    AND status = 'called'
    AND called_at IS NOT NULL
    AND called_at <= now() - (
      COALESCE((
        SELECT q.no_show_grace_minutes
        FROM public.queues q
        WHERE q.id = p_queue_id
      ), 3) * interval '1 minute'
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

-- Preserve queue operation behavior, timestamp calls, exclude unverified entries,
-- and mark overdue calls as no-shows using each queue's configured grace period.
CREATE OR REPLACE FUNCTION public.admin_call_next(p_queue_id uuid)
 RETURNS TABLE(entry_id uuid, token_number integer, entry_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_queue_status text;
  v_next_entry_id uuid;
  v_next_token integer;
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  SELECT q.status INTO v_queue_status
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue not found';
  END IF;
  IF v_queue_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Queue must be active';
  END IF;

  UPDATE public.queue_entries qe
  SET status = 'no_show',
      no_show_at = now()
  WHERE qe.queue_id = p_queue_id
    AND qe.status = 'called'
    AND qe.called_at IS NOT NULL
    AND qe.called_at <= now() - (
      COALESCE((
        SELECT q.no_show_grace_minutes
        FROM public.queues q
        WHERE q.id = p_queue_id
      ), 3) * interval '1 minute'
    );

  IF EXISTS (
    SELECT 1 FROM public.queue_entries qe
    WHERE qe.queue_id = p_queue_id AND qe.status = 'called'
  ) THEN
    RAISE EXCEPTION 'The current token is still called. Mark it served or no-show before calling next.';
  END IF;

  SELECT qe.id, qe.token_number
  INTO v_next_entry_id, v_next_token
  FROM public.queue_entries qe
  WHERE qe.queue_id = p_queue_id
    AND qe.status = 'waiting'
  ORDER BY qe.token_number
  LIMIT 1
  FOR UPDATE;

  IF v_next_entry_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.queue_entries qe
  SET status = 'called',
      called_at = now()
  WHERE qe.id = v_next_entry_id;

  RETURN QUERY
  SELECT v_next_entry_id, v_next_token, 'called'::text;
END;
$function$;

-- Serving and calling the next customer are separate operations.
CREATE OR REPLACE FUNCTION public.admin_complete_current(p_queue_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_queue_status text;
  v_entry_id uuid;
  v_token integer;
  v_called_at timestamptz;
  v_grace integer;
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  SELECT q.status, q.no_show_grace_minutes
  INTO v_queue_status, v_grace
  FROM public.queues q
  WHERE q.id = p_queue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue not found';
  END IF;
  IF v_queue_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'Queue must be active';
  END IF;

  SELECT qe.id, qe.token_number, qe.called_at
  INTO v_entry_id, v_token, v_called_at
  FROM public.queue_entries qe
  WHERE qe.queue_id = p_queue_id AND qe.status = 'called'
  ORDER BY qe.token_number
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No currently called token to mark as served';
  END IF;

  IF v_called_at IS NOT NULL
     AND v_called_at <= now() - (COALESCE(v_grace, 3) * interval '1 minute') THEN
    RAISE EXCEPTION 'The no-show grace period has elapsed. Mark this token as no-show instead.';
  END IF;

  UPDATE public.queue_entries
  SET status = 'completed',
      served_at = now()
  WHERE id = v_entry_id;

  RETURN v_token;
END;
$function$;

-- Service owners can adjust their own queue's no-show grace period (1-30 minutes).
CREATE OR REPLACE FUNCTION public.admin_get_no_show_grace(p_queue_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_minutes integer;
BEGIN
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  SELECT q.no_show_grace_minutes INTO v_minutes
  FROM public.queues q
  WHERE q.id = p_queue_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue not found';
  END IF;

  RETURN v_minutes;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_no_show_grace(
  p_queue_id uuid,
  p_minutes integer
)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 30 THEN
    RAISE EXCEPTION 'Grace period must be between 1 and 30 minutes';
  END IF;
  IF NOT public.can_manage_queue(p_queue_id) THEN
    RAISE EXCEPTION 'Access denied: not the service owner';
  END IF;

  UPDATE public.queues
  SET no_show_grace_minutes = p_minutes
  WHERE id = p_queue_id;

  RETURN p_minutes;
END;
$function$;

-- Access is granted only to authenticated users; each SECURITY DEFINER RPC
-- checks the customer or service-owner identity on the server.
REVOKE ALL ON FUNCTION public.join_queue_secure(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_call_next(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_complete_current(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_create_queue_checkin_code(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_queue_arrival(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_my_queue_entry(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_list_pending_entries(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_verify_pending_entry(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_reject_pending_entry(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_mark_current_no_show(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_expire_no_shows(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_get_no_show_grace(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_no_show_grace(uuid, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.join_queue_secure(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_call_next(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_complete_current(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_queue_checkin_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_queue_arrival(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_my_queue_entry(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_entries(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_verify_pending_entry(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reject_pending_entry(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_mark_current_no_show(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_expire_no_shows(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_no_show_grace(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_no_show_grace(uuid, integer) TO authenticated, service_role;

COMMIT;
