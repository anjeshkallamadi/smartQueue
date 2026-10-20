-- Run only on a fresh, disposable Supabase LOCAL database.
-- supabase test db wraps the changes in a transaction that is rolled back.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated;
SELECT plan(44);

-- Confirm the baseline was applied and core objects exist.
SELECT has_table('public', 'users', 'User profiles table exists');
SELECT has_table('public', 'services', 'Services table exists');
SELECT has_table('public', 'queues', 'Queues table exists');
SELECT has_table('public', 'queue_entries', 'Queue entries table exists');
SELECT has_table('public', 'notifications', 'Notifications table exists');
SELECT ok(to_regprocedure('public.join_queue_secure(uuid)') IS NOT NULL, 'Secure joining RPC exists');
SELECT ok(to_regprocedure('public.can_manage_queue(uuid)') IS NOT NULL, 'Ownership RPC exists');
SELECT ok(EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'queues'
), 'Queues are included in Supabase Realtime publication');
SELECT ok(EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
      AND t.tgname = 'on_auth_user_created' AND NOT t.tgisinternal
), 'Auth signup trigger exists');

-- Synthetic users: two independent service owners and three customers.
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
('10000000-0000-4000-8000-000000000001', 'admin-a@example.test', '{"name":"Admin A"}'::jsonb),
('10000000-0000-4000-8000-000000000002', 'admin-b@example.test', '{"name":"Admin B"}'::jsonb),
('10000000-0000-4000-8000-000000000003', 'customer-a@example.test', '{"name":"Customer A"}'::jsonb),
('10000000-0000-4000-8000-000000000004', 'customer-b@example.test', '{"name":"Customer B"}'::jsonb),
('10000000-0000-4000-8000-000000000005', 'customer-c@example.test', '{"name":"Customer C"}'::jsonb);

SELECT is(
    (SELECT name FROM public.users WHERE id = '10000000-0000-4000-8000-000000000003'),
    'Customer A', 'Signup trigger created customer profile'
);

UPDATE public.users SET role = 'admin'
WHERE id IN ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002');

INSERT INTO public.services (id, name, owner_id) VALUES
('30000000-0000-4000-8000-000000000001', 'Owner A Service', '10000000-0000-4000-8000-000000000001'),
('30000000-0000-4000-8000-000000000002', 'Owner B Service', '10000000-0000-4000-8000-000000000002');

INSERT INTO public.queues (id, service_id, status, date) VALUES
('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'active', CURRENT_DATE),
('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'active', CURRENT_DATE),
('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', NULL, CURRENT_DATE);

-- Exercise RLS and join RPC as a regular authenticated customer.
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000003';
SELECT is(public.is_queue_admin(), FALSE, 'Customer does not have admin role');
SELECT is((SELECT COUNT(*) FROM public.users), 1::bigint, 'Customer can read only their own profile');
SELECT ok(NOT has_table_privilege('authenticated', 'public.queue_entries', 'INSERT'), 'Direct entry insert denied');
SELECT ok(NOT has_table_privilege('authenticated', 'public.queue_entries', 'TRUNCATE'), 'Entry table truncate denied');
SELECT ok(NOT has_column_privilege('authenticated', 'public.users', 'role', 'UPDATE'), 'Users cannot change their own role');
SELECT ok(NOT has_table_privilege('authenticated', 'public.queues', 'UPDATE'), 'Direct queue mutation denied');
SELECT is((SELECT token_number FROM public.join_queue_secure('20000000-0000-4000-8000-000000000001')), 1, 'First join issues token 1');
SELECT is((SELECT token_number FROM public.join_queue_secure('20000000-0000-4000-8000-000000000001')), 1, 'Second join reuses active token');
SELECT is((SELECT current_token FROM public.queues WHERE id = '20000000-0000-4000-8000-000000000001'), 1, 'Repeated join does not advance token counter');
SELECT is((SELECT people_ahead FROM public.get_my_queue_position('20000000-0000-4000-8000-000000000001')), 0::bigint, 'First customer has nobody ahead');
SELECT is((SELECT realtime_version FROM public.queues WHERE id = '20000000-0000-4000-8000-000000000001'), 1::bigint, 'Joining signals a realtime queue update');

SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000004';
SELECT is((SELECT COUNT(*) FROM public.queue_entries), 0::bigint, 'Second customer cannot see another customer entry');
SELECT is((SELECT token_number FROM public.join_queue_secure('20000000-0000-4000-8000-000000000001')), 2, 'Second customer receives unique token 2');
SELECT is((SELECT COUNT(*) FROM public.queue_entries), 1::bigint, 'Customer sees only their own active entry');
SELECT is((SELECT people_ahead FROM public.get_my_queue_position('20000000-0000-4000-8000-000000000001')), 1::bigint, 'Second customer has one person ahead');

-- Admin B must not control Admin A's service.
SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
SELECT is(public.is_queue_admin(), TRUE, 'Service owner has admin role');
SELECT is((SELECT COUNT(*) FROM public.get_my_managed_queues()), 1::bigint, 'Admin B sees only their one managed queue');
SELECT is((SELECT queue_id FROM public.get_my_managed_queues()), '20000000-0000-4000-8000-000000000002'::uuid, 'Admin B sees only their service queue');
SELECT throws_ok($$SELECT * FROM public.admin_call_next('20000000-0000-4000-8000-000000000001')$$,
    'P0001', 'Access denied: not the service owner', 'Non-owner cannot call next');
SELECT throws_ok($$SELECT public.admin_skip_current('20000000-0000-4000-8000-000000000001')$$,
    'P0001', 'Access denied: not the service owner', 'Non-owner cannot skip tokens');
SELECT throws_ok($$SELECT public.admin_pause_queue('20000000-0000-4000-8000-000000000001')$$,
    'P0001', 'Access denied: not the service owner', 'Non-owner cannot pause queue');
SELECT throws_ok($$SELECT public.admin_resume_queue('20000000-0000-4000-8000-000000000001')$$,
    'P0001', 'Access denied: not the service owner', 'Non-owner cannot resume queue');

-- Admin A can call, skip, pause and resume their own queue.
SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
SELECT is((SELECT token_number FROM public.admin_call_next('20000000-0000-4000-8000-000000000001')), 1, 'Owner calls token 1');
SELECT is(public.get_queue_now_serving('20000000-0000-4000-8000-000000000001'), 1, 'Now Serving returns the called token');
SELECT is(public.admin_skip_current('20000000-0000-4000-8000-000000000001'), 1, 'Owner skips token 1');
SELECT is(public.get_queue_now_serving('20000000-0000-4000-8000-000000000001'), NULL::integer, 'Skip does not automatically call next token');
SELECT is(public.admin_pause_queue('20000000-0000-4000-8000-000000000001'), 'paused', 'Owner pauses queue');
SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000005';
SELECT throws_ok($$SELECT * FROM public.join_queue_secure('20000000-0000-4000-8000-000000000001')$$,
    'P0001', 'Queue is not active', 'New customer cannot join paused queue');
SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
SELECT is(public.admin_resume_queue('20000000-0000-4000-8000-000000000001'), 'active', 'Owner resumes paused queue');
SELECT is((SELECT token_number FROM public.admin_call_next('20000000-0000-4000-8000-000000000001')), 2, 'Owner calls next waiting token');

-- Null status must NOT bypass administrative status guards.
SELECT throws_ok($$SELECT * FROM public.admin_call_next('20000000-0000-4000-8000-000000000003')$$,
    'P0001', 'Queue must be active', 'NULL status cannot bypass Call Next guard');
SELECT throws_ok($$SELECT public.admin_skip_current('20000000-0000-4000-8000-000000000003')$$,
    'P0001', 'Queue must be active', 'NULL status cannot bypass Skip guard');
SELECT throws_ok($$SELECT public.admin_pause_queue('20000000-0000-4000-8000-000000000003')$$,
    'P0001', 'Only active queues can be paused', 'NULL status cannot bypass Pause guard');
SELECT throws_ok($$SELECT public.admin_resume_queue('20000000-0000-4000-8000-000000000003')$$,
    'P0001', 'Only paused queues can be resumed', 'NULL status cannot bypass Resume guard');

SELECT * FROM finish();
ROLLBACK;
