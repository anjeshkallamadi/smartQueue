BEGIN;
SELECT plan(10);
SELECT ok(to_regprocedure('public.create_service_queue(text,text,text,text,integer)') IS NOT NULL,
    'Service creation RPC exists');
SELECT ok(NOT has_function_privilege('anon',
  'public.create_service_queue(text,text,text,text,integer)', 'EXECUTE'),
  'Anonymous callers cannot execute the service creation RPC');
SELECT ok(has_function_privilege('authenticated',
  'public.create_service_queue(text,text,text,text,integer)', 'EXECUTE'),
  'Authenticated callers can execute RPC, subject to in-function authorization');

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES ('5a000000-0000-4000-8000-000000000001', 'test-customer@example.test', '{}'::jsonb),
       ('5a000000-0000-4000-8000-000000000002', 'test-owner@example.test', '{}'::jsonb);
UPDATE public.users SET role = 'admin'
WHERE id = '5a000000-0000-4000-8000-000000000002';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '5a000000-0000-4000-8000-000000000001';
SELECT throws_ok($$SELECT * FROM public.create_service_queue('Illegal service')$$,
    'P0001', 'Only administrators can create services',
    'A normal user cannot create a service');
SELECT ok(NOT has_table_privilege('authenticated','public.services','INSERT'),
    'No direct service insert privilege');

SET LOCAL request.jwt.claim.sub = '5a000000-0000-4000-8000-000000000002';
SELECT throws_ok($$SELECT * FROM public.create_service_queue('X')$$,
    'P0001', 'Service name must have 3 to 100 characters',
    'Reject very short service names');
SELECT throws_ok($$SELECT * FROM public.create_service_queue('Valid service', NULL, NULL, NULL, 0)$$,
    'P0001', 'Average service time must be 1 to 240 minutes',
    'Reject invalid service time');

CREATE TEMP TABLE test_created AS
SELECT * FROM public.create_service_queue(
  'QR Test Hospital', 'A registration counter', 'Health', 'Block A', 7
);
SELECT is((SELECT name FROM public.services WHERE id = (SELECT service_id FROM test_created)),
    'QR Test Hospital', 'The service was persisted');
SELECT is((SELECT owner_id FROM public.services WHERE id = (SELECT service_id FROM test_created)),
    '5a000000-0000-4000-8000-000000000002'::uuid,
    'The new service is owned by the authenticated admin');
SELECT is((SELECT status FROM public.queues WHERE id = (SELECT queue_id FROM test_created)),
    'active', 'The new queue is immediately active');
SELECT * FROM finish();
ROLLBACK;
