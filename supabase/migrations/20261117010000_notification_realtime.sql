-- Enable foreground notification delivery without changing existing queue triggers.
BEGIN;

-- RLS remains the security boundary for Postgres Changes subscribers.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enforce owner-only reads even if the live project has additional legacy
-- permissive SELECT policies. Keep the existing owner-only permissive policy.
DROP POLICY IF EXISTS smartqueue_notifications_owner_read_guard ON public.notifications;
CREATE POLICY smartqueue_notifications_owner_read_guard
    ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DO $realtime$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        RAISE EXCEPTION 'supabase_realtime publication is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END;
$realtime$;

COMMIT;
