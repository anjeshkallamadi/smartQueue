-- Creates a service and its initial queue together.
-- Service IDs are stable, unique QR destinations.
-- New-project migration: already-existing installations apply this
-- incremental function only, NOT the earlier schema baseline.
BEGIN;
CREATE OR REPLACE FUNCTION public.create_service_queue(
    p_name text,
    p_description text DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_average_service_time integer DEFAULT 10
)
RETURNS TABLE(service_id uuid, queue_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_owner uuid;
    v_service_id uuid;
    v_queue_id uuid;
BEGIN
    v_owner := auth.uid();
    IF v_owner IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = v_owner AND u.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only administrators can create services';
    END IF;

    IF p_name IS NULL OR length(btrim(p_name)) < 3
       OR length(btrim(p_name)) > 100 THEN
        RAISE EXCEPTION 'Service name must have 3 to 100 characters';
    END IF;

    IF p_description IS NOT NULL AND length(p_description) > 500 THEN
        RAISE EXCEPTION 'Description must be at most 500 characters';
    END IF;
    IF p_category IS NOT NULL AND length(p_category) > 60 THEN
        RAISE EXCEPTION 'Category must be at most 60 characters';
    END IF;
    IF p_location IS NOT NULL AND length(p_location) > 160 THEN
        RAISE EXCEPTION 'Location must be at most 160 characters';
    END IF;
    IF p_average_service_time IS NULL OR p_average_service_time < 1
       OR p_average_service_time > 240 THEN
        RAISE EXCEPTION 'Average service time must be 1 to 240 minutes';
    END IF;

    INSERT INTO public.services (
        name, description, category, location, status, owner_id
    ) VALUES (
        btrim(p_name),
        nullif(btrim(p_description), ''),
        nullif(btrim(p_category), ''),
        nullif(btrim(p_location), ''),
        'active',
        v_owner
    ) RETURNING id INTO v_service_id;

    INSERT INTO public.queues (
        service_id, date, status, current_token, average_service_time
    ) VALUES (
        v_service_id, CURRENT_DATE, 'active', 0, p_average_service_time
    ) RETURNING id INTO v_queue_id;

    RETURN QUERY SELECT v_service_id, v_queue_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_service_queue(text, text, text, text, integer)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_service_queue(text, text, text, text, integer)
    TO authenticated;
COMMIT;
