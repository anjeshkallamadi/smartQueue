-- Generate in-app queue notifications from database events.
-- Review against the live schema and test in staging before deployment.
BEGIN;

-- Alert a waiting customer once per queue entry when at most two active
-- tokens precede them (called tokens count, matching get_my_queue_position).
CREATE OR REPLACE FUNCTION public.smartqueue_notify_approaching(p_queue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Existing customer/admin queue RPCs serialize changes on this row.
    -- Lock here as well to serialize approach-alert generation.
    PERFORM 1 FROM public.queues q
    WHERE q.id = p_queue_id AND q.status = 'active'
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    WITH upcoming AS (
        SELECT qe.id, qe.user_id, qe.status, qe.token_number,
               row_number() OVER (ORDER BY qe.token_number) - 1 AS people_ahead
        FROM public.queue_entries qe
        WHERE qe.queue_id = p_queue_id
          AND qe.status IN ('waiting', 'called')
          AND qe.token_number IS NOT NULL
        ORDER BY qe.token_number
        LIMIT 3
    )
    INSERT INTO public.notifications (user_id, queue_entry_id, type, message)
    SELECT u.user_id, u.id, 'turn_approaching',
           format('Your turn is approaching. People ahead: %s. Please be ready.',
                  u.people_ahead)
    FROM upcoming u
    WHERE u.status = 'waiting' AND u.user_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.notifications n
          WHERE n.queue_entry_id = u.id AND n.type = 'turn_approaching'
      );
END;
$function$;

CREATE OR REPLACE FUNCTION public.smartqueue_notify_entry_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_type text;
    v_message text;
    v_service text;
    v_token text;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
            RETURN NEW;
        END IF;
    END IF;

    SELECT COALESCE(s.name, 'your service') INTO v_service
    FROM public.queues q
    LEFT JOIN public.services s ON s.id = q.service_id
    WHERE q.id = NEW.queue_id;
    v_service := COALESCE(v_service, 'your service');
    v_token := CASE
        WHEN NEW.token_number IS NULL THEN 'your token'
        ELSE 'A' || lpad(NEW.token_number::text,
                      GREATEST(3, length(NEW.token_number::text)), '0')
    END;

    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'waiting' THEN
            v_type := 'queue_joined';
            v_message := format('You joined %s. Token: %s.', v_service, v_token);
        END IF;
    ELSE
        CASE NEW.status
            WHEN 'called' THEN
                v_type := 'turn_called';
                v_message := format('Token %s is now being called at %s. Please proceed to the counter.', v_token, v_service);
            WHEN 'completed' THEN
                v_type := 'appointment_completed';
                v_message := format('Token %s has been completed at %s.', v_token, v_service);
            WHEN 'skipped' THEN
                v_type := 'token_skipped';
                v_message := format('Token %s was skipped at %s. Please contact the service provider.', v_token, v_service);
            ELSE
                NULL;
        END CASE;
    END IF;

    IF v_type IS NOT NULL AND NEW.user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, queue_entry_id, type, message)
        VALUES (NEW.user_id, NEW.id, v_type, v_message);
    END IF;

    IF NEW.queue_id IS NOT NULL THEN
        PERFORM public.smartqueue_notify_approaching(NEW.queue_id);
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.smartqueue_notify_queue_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_type text;
    v_message text;
    v_service text;
BEGIN
    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
    END IF;

    IF OLD.status = 'active' AND NEW.status = 'paused' THEN
        v_type := 'queue_paused';
    ELSIF OLD.status = 'paused' AND NEW.status = 'active' THEN
        v_type := 'queue_resumed';
    ELSE
        RETURN NEW;
    END IF;

    SELECT s.name INTO v_service FROM public.services s
    WHERE s.id = NEW.service_id;
    v_service := COALESCE(v_service, 'your service');
    IF v_type = 'queue_paused' THEN
        v_message := format('The queue at %s is temporarily paused. Your token is preserved.', v_service);
    ELSE
        v_message := format('The queue at %s has resumed. Please check your queue position.', v_service);
    END IF;

    INSERT INTO public.notifications (user_id, queue_entry_id, type, message)
    SELECT qe.user_id, qe.id, v_type, v_message
    FROM public.queue_entries qe
    WHERE qe.queue_id = NEW.id AND qe.user_id IS NOT NULL
      AND qe.status IN ('waiting', 'called');

    IF v_type = 'queue_resumed' THEN
        PERFORM public.smartqueue_notify_approaching(NEW.id);
    END IF;
    RETURN NEW;
END;
$function$;

-- Helpers must not be callable by mobile clients as RPCs.
REVOKE ALL ON FUNCTION public.smartqueue_notify_approaching(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.smartqueue_notify_entry_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.smartqueue_notify_queue_status() FROM PUBLIC, anon, authenticated;

-- Existing RLS and queue authorization are unchanged.
CREATE INDEX IF NOT EXISTS idx_smartqueue_notifications_user_created
    ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartqueue_notifications_entry_type
    ON public.notifications (queue_entry_id, type);

DROP TRIGGER IF EXISTS trg_smartqueue_notify_entry_change ON public.queue_entries;
CREATE TRIGGER trg_smartqueue_notify_entry_change
    AFTER INSERT OR UPDATE OF status ON public.queue_entries
    FOR EACH ROW EXECUTE FUNCTION public.smartqueue_notify_entry_change();

DROP TRIGGER IF EXISTS trg_smartqueue_notify_queue_status ON public.queues;
CREATE TRIGGER trg_smartqueue_notify_queue_status
    AFTER UPDATE OF status ON public.queues
    FOR EACH ROW EXECUTE FUNCTION public.smartqueue_notify_queue_status();

COMMIT;
