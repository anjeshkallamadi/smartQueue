-- SmartQueue baseline migration
-- Source: live SmartQueue Supabase PostgreSQL catalog inspected 2026-10-20.
-- For a NEW Supabase database, not for reapplying to the existing linked project.
-- Includes schema, indexes, owner-scoped queue RPCs, RLS, safe app grants,
-- auth user trigger, and Realtime publication configuration.
-- No production users, queue records, or personal data are included.
-- Security note: the app grants and obsolete RLS policies here are intentionally
-- restricted compared with some legacy permissions in the live project.

BEGIN;

-- 1. Tables and referential integrity (actual deployed column defaults/nullability).
CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    name text,
    email text,
    role text DEFAULT 'user'::text
);

CREATE TABLE public.services (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    name text,
    description text,
    category text,
    location text,
    status text DEFAULT 'active'::text,
    owner_id uuid REFERENCES public.users(id)
);

CREATE TABLE public.queues (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
    date date,
    status text DEFAULT 'waiting'::text,
    current_token integer DEFAULT 0,
    average_service_time integer DEFAULT 10,
    realtime_version bigint NOT NULL DEFAULT 0
);

CREATE TABLE public.queue_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id uuid REFERENCES public.queues(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    token_number integer,
    status text DEFAULT 'waiting'::text,
    joined_at timestamptz DEFAULT now(),
    served_at timestamptz
);

CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    queue_entry_id uuid REFERENCES public.queue_entries(id) ON DELETE CASCADE,
    type text,
    message text,
    is_read boolean DEFAULT false
);

CREATE INDEX idx_services_owner_id ON public.services USING btree (owner_id);
CREATE UNIQUE INDEX unique_queue_token ON public.queue_entries USING btree (queue_id, token_number);
CREATE UNIQUE INDEX unique_active_queue_user ON public.queue_entries USING btree (queue_id, user_id)
    WHERE status = ANY (ARRAY['waiting'::text, 'called'::text]);

COMMENT ON TABLE public.users IS 'Stores application user profiles and roles';
COMMENT ON TABLE public.services IS 'Stores services available for virtual queuing';
COMMENT ON TABLE public.queues IS 'Stores virtual queues for services';
COMMENT ON TABLE public.queue_entries IS 'Stores users'' entries and tokens in queues';
COMMENT ON TABLE public.notifications IS 'Stores notifications sent to users about their queue';

-- 2. Authorization functions, transcribed from pg_get_functiondef.
CREATE OR REPLACE FUNCTION public.is_queue_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_queue(p_queue_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.queues q
        JOIN public.services s
            ON s.id = q.service_id
        JOIN public.users u
            ON u.id = s.owner_id
        WHERE q.id = p_queue_id
          AND s.owner_id = (SELECT auth.uid())
          AND u.role = 'admin'
    );
$function$;

-- 3. Customer queue RPCs.
CREATE OR REPLACE FUNCTION public.join_queue_secure(p_queue_id uuid)
 RETURNS TABLE(entry_id uuid, queue_id uuid, token_number integer, entry_status text, people_ahead bigint)
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

    -- Lock the queue so concurrent joins are serialized.
    SELECT q.status INTO v_queue_status
    FROM public.queues AS q
    WHERE q.id = p_queue_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Queue not found';
    END IF;

    -- Reuse the user's existing active entry.
    SELECT qe.id, qe.token_number, qe.status
    INTO v_entry_id, v_token, v_status
    FROM public.queue_entries AS qe
    WHERE qe.queue_id = p_queue_id
      AND qe.user_id = v_user_id
      AND qe.status IN ('waiting', 'called')
    LIMIT 1;

    IF v_entry_id IS NULL THEN
        IF v_queue_status IS DISTINCT FROM 'active' THEN
            RAISE EXCEPTION 'Queue is not active';
        END IF;

        -- Increment the persistent counter atomically.
        UPDATE public.queues AS q
        SET current_token =
            GREATEST(
                COALESCE(q.current_token, 0),
                COALESCE((
                    SELECT MAX(qe.token_number)
                    FROM public.queue_entries AS qe
                    WHERE qe.queue_id = p_queue_id
                ), 0)
            ) + 1
        WHERE q.id = p_queue_id
        RETURNING q.current_token INTO v_token;

        INSERT INTO public.queue_entries (
            queue_id, user_id, token_number, status
        ) VALUES (
            p_queue_id, v_user_id, v_token, 'waiting'
        ) RETURNING id, status INTO v_entry_id, v_status;
    END IF;

    RETURN QUERY
    SELECT v_entry_id, p_queue_id, v_token, v_status,
        (
            SELECT COUNT(*)
            FROM public.queue_entries AS qe
            WHERE qe.queue_id = p_queue_id
              AND qe.status IN ('waiting', 'called')
              AND qe.token_number < v_token
        );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_queue_position(p_queue_id uuid)
 RETURNS TABLE(token_number integer, entry_status text, people_ahead bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid;
    v_token integer;
    v_status text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT qe.token_number, qe.status
    INTO v_token, v_status
    FROM public.queue_entries qe
    WHERE qe.queue_id = p_queue_id
      AND qe.user_id = v_user_id
      AND qe.status IN ('waiting', 'called')
    ORDER BY qe.joined_at DESC
    LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active queue entry found';
    END IF;

    RETURN QUERY
    SELECT v_token, v_status, COUNT(*)::bigint
    FROM public.queue_entries qe
    WHERE qe.queue_id = p_queue_id
      AND qe.token_number < v_token
      AND qe.status IN ('waiting', 'called');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_queue_now_serving(p_queue_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT qe.token_number
    FROM public.queue_entries qe
    JOIN public.queues q
      ON q.id = qe.queue_id
    WHERE q.id = p_queue_id
      AND qe.status = 'called'
      AND (SELECT auth.uid()) IS NOT NULL
    ORDER BY qe.token_number ASC
    LIMIT 1;
$function$;

-- 4. Provider dashboard and queue operation RPCs.
CREATE OR REPLACE FUNCTION public.get_my_managed_queues()
 RETURNS TABLE(queue_id uuid, service_name text, queue_status text, waiting_count bigint, called_token integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT q.id AS queue_id, s.name AS service_name,
           q.status AS queue_status,
           (
               SELECT COUNT(*) FROM public.queue_entries qe
               WHERE qe.queue_id = q.id AND qe.status = 'waiting'
           ) AS waiting_count,
           (
               SELECT qe.token_number FROM public.queue_entries qe
               WHERE qe.queue_id = q.id AND qe.status = 'called'
               ORDER BY qe.token_number DESC LIMIT 1
           ) AS called_token
    FROM public.queues q
    JOIN public.services s ON s.id = q.service_id
    JOIN public.users u ON u.id = s.owner_id
    WHERE s.owner_id = (SELECT auth.uid())
      AND u.role = 'admin'
    ORDER BY s.name, q.date DESC;
$function$;

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
    -- Check ownership and admin role.
    IF NOT public.can_manage_queue(p_queue_id) THEN
        RAISE EXCEPTION 'Access denied: not the service owner';
    END IF;
    -- Lock queue to serialize operations.
    SELECT q.status INTO v_queue_status
    FROM public.queues q
    WHERE q.id = p_queue_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Queue not found';
    END IF;
    IF v_queue_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'Queue must be active';
    END IF;

    -- Complete the currently called entry.
    UPDATE public.queue_entries qe
    SET status = 'completed', served_at = now()
    WHERE qe.queue_id = p_queue_id AND qe.status = 'called';

    -- Select the earliest waiting entry.
    SELECT qe.id, qe.token_number INTO v_next_entry_id, v_next_token
    FROM public.queue_entries qe
    WHERE qe.queue_id = p_queue_id AND qe.status = 'waiting'
    ORDER BY qe.token_number LIMIT 1 FOR UPDATE;
    IF v_next_entry_id IS NULL THEN
        RETURN;
    END IF;

    -- Call the next token.
    UPDATE public.queue_entries qe SET status = 'called'
    WHERE qe.id = v_next_entry_id;

    RETURN QUERY SELECT v_next_entry_id, v_next_token, 'called'::text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_skip_current(p_queue_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_queue_status text;
    v_entry_id uuid;
    v_token_number integer;
BEGIN
    -- Only the service owner can skip tokens.
    IF NOT public.can_manage_queue(p_queue_id) THEN
        RAISE EXCEPTION 'Access denied: not the service owner';
    END IF;
    -- Lock the queue to prevent conflicting operations.
    SELECT q.status INTO v_queue_status
    FROM public.queues q WHERE q.id = p_queue_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Queue not found';
    END IF;
    IF v_queue_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'Queue must be active';
    END IF;

    -- Find the currently called token.
    SELECT qe.id, qe.token_number INTO v_entry_id, v_token_number
    FROM public.queue_entries qe
    WHERE qe.queue_id = p_queue_id AND qe.status = 'called'
    ORDER BY qe.token_number ASC LIMIT 1 FOR UPDATE;
    IF v_entry_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Skip only the selected token; don't automatically call the next.
    UPDATE public.queue_entries SET status = 'skipped'
    WHERE id = v_entry_id;
    RETURN v_token_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_pause_queue(p_queue_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_status text;
BEGIN
    IF NOT public.can_manage_queue(p_queue_id) THEN
        RAISE EXCEPTION 'Access denied: not the service owner';
    END IF;
    SELECT status INTO v_status FROM public.queues
    WHERE id = p_queue_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Queue not found';
    END IF;
    IF v_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'Only active queues can be paused';
    END IF;
    UPDATE public.queues SET status = 'paused' WHERE id = p_queue_id;
    RETURN 'paused';
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_resume_queue(p_queue_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_status text;
BEGIN
    IF NOT public.can_manage_queue(p_queue_id) THEN
        RAISE EXCEPTION 'Access denied: not the service owner';
    END IF;
    SELECT status INTO v_status FROM public.queues
    WHERE id = p_queue_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Queue not found';
    END IF;
    IF v_status IS DISTINCT FROM 'paused' THEN
        RAISE EXCEPTION 'Only paused queues can be resumed';
    END IF;
    UPDATE public.queues SET status = 'active' WHERE id = p_queue_id;
    RETURN 'active';
END;
$function$;

-- 5. Trigger functions and triggers.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.signal_queue_entry_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.queues
        SET realtime_version = realtime_version + 1
        WHERE id = OLD.queue_id;
        RETURN OLD;
    END IF;
    UPDATE public.queues
    SET realtime_version = realtime_version + 1
    WHERE id = NEW.queue_id;
    IF TG_OP = 'UPDATE'
       AND OLD.queue_id IS DISTINCT FROM NEW.queue_id THEN
        UPDATE public.queues
        SET realtime_version = realtime_version + 1
        WHERE id = OLD.queue_id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_queue_entry_realtime
  AFTER INSERT OR DELETE OR UPDATE ON public.queue_entries
  FOR EACH ROW EXECUTE FUNCTION public.signal_queue_entry_change();

-- 6. Enable RLS everywhere; app permissions below do not rely on client-side checks.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view services" ON public.services
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service owners can update own services" ON public.services
    FOR UPDATE TO authenticated
    USING (owner_id = (SELECT auth.uid()) AND (SELECT public.is_queue_admin()))
    WITH CHECK (owner_id = (SELECT auth.uid()) AND (SELECT public.is_queue_admin()));

CREATE POLICY "Authenticated users can view queues" ON public.queues
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own queue entries" ON public.queue_entries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Notifications are a deferred feature: read and mark own notifications only.
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Explicit app grants. Legacy live grants include broader privileges
-- (notably TRUNCATE, which bypasses RLS); this baseline intentionally omits them.
REVOKE ALL ON public.users, public.services, public.queues,
    public.queue_entries, public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users, public.services, public.queues,
    public.queue_entries, public.notifications TO authenticated;
GRANT UPDATE (name, description, category, location, status)
    ON public.services TO authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;
GRANT ALL ON public.users, public.services, public.queues,
    public.queue_entries, public.notifications TO service_role;

-- Deny PUBLIC/anon execution of callable RPCs; trigger helpers are not RPCs.
REVOKE ALL ON FUNCTION public.is_queue_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_queue(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_queue_secure(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_queue_position(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_queue_now_serving(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_managed_queues() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_call_next(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_skip_current(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_pause_queue(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_resume_queue(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signal_queue_entry_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_queue_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_queue(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_queue_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_queue_position(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_now_serving(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_managed_queues() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_call_next(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_skip_current(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_pause_queue(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resume_queue(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_queue_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_queue(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.join_queue_secure(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_queue_position(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_queue_now_serving(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_managed_queues() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_call_next(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_skip_current(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_pause_queue(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_resume_queue(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.signal_queue_entry_change() TO service_role;

-- 8. Supabase Realtime: events for public queue summary changes ONLY,
-- not for private queue_entries or notification rows.
DO $do$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'queues'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
    END IF;
END;
$do$;

COMMIT;
