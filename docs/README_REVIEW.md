# SmartQueue PR #12 — database baseline and validation

Updated 2026-10-20 for [PR #12](https://github.com/anjeshkallamadi/smartQueue/pull/12).
The migration was reconstructed from the existing SmartQueue Supabase PostgreSQL catalog and targets a **fresh Supabase local database**. It does not export live users or queue records.

## Changed files

- supabase/migrations/20261020000000_smartqueue_baseline.sql — new-project database schema and privileges.
- supabase/tests/database/smartqueue_security.test.sql — 44 pgTAP assertions using synthetic identities.
- .github/workflows/database-validation.yml — isolated local Supabase validation in GitHub Actions.
- src/app/home.tsx and styles/homeStyles.ts — removed development-only queue-test navigation and styles.

## Baseline contents

- Five tables: users, services, queues, queue_entries and notifications; deployed column defaults, keys and references.
- Token-uniqueness/active-entry indexes and service-owner index.
- Owner/admin and customer RPCs: is_queue_admin, can_manage_queue, join_queue_secure, get_my_queue_position, get_queue_now_serving, get_my_managed_queues, admin_call_next, admin_skip_current, admin_pause_queue and admin_resume_queue.
- Signup and queue-entry trigger functions, RLS policies, grants and queues Realtime publication membership.
- NULL-safe IS DISTINCT FROM guards in all four admin state-changing functions.

## Fresh local Supabase validation: PASS

**CI run:** [SmartQueue database validation, run #2](https://github.com/anjeshkallamadi/smartQueue/actions/runs/39462171544)

**Environment:** A disposable local Supabase stack on GitHub-hosted Ubuntu using the official Supabase CLI; no connection to the live SmartQueue project.

**Result on 2026-10-20:** Supabase initialized and applied the baseline on the fresh local database successfully. The database test command reported **Files=1, Tests=44, Result: PASS**. Workflow teardown also succeeded.

The [versioned pgTAP tests](../supabase/tests/database/smartqueue_security.test.sql) cover all five tables, important RPCs, signup-to-profile trigger, publication membership, RLS and table grants, self-only row access, join idempotency, unique token issuance, queue position, Realtime version increments, non-owner denial for all four admin actions, owner Call Next/Skip/Pause/Resume, paused-queue join denial and all four NULL-status guards.

**Scope limits:** CI does not test simultaneous/concurrent joins, actual Realtime WebSocket delivery, the mobile app UI or unfinished notification flows. These remain separate validation tasks.

## Difference from live database privileges

The live project still has some legacy broader grants (including TRUNCATE) and older queue-entry mutation and notification policies. TRUNCATE bypasses RLS. The fresh-environment baseline proposes tighter authenticated/anon permissions, no direct queue-entry mutations and a restricted notification flow. These intentional differences must be reviewed and, if approved, deployed to the live database in a separate controlled migration.

The live queues.status column is nullable and defaults to waiting. The baseline preserves this deployed schema. It now contains NULL-safe guards, but **live admin RPCs have not yet been updated** with those guards. No service-creation, queue-creation or notification-generation RPCs are included.

## IMPORTANT: Never apply this baseline to the existing live database

The SQL includes CREATE TABLE statements and is for **new database instances**. Do not paste the baseline into the live SQL editor; do not run db reset or db push against the linked project. Before using versioned migrations against the existing project, reconcile its migration history in a separately reviewed procedure. This validation did not change live data, schema, permissions or tokens.

## Reproduce validation

On a Docker-enabled machine, from the repository root:

~~~powershell
supabase init
supabase start
supabase test db
supabase stop --no-backup
~~~

Alternatively, push changes to the supabase directory on a PR targeting main: GitHub Actions runs the tests on its isolated runner with no live Supabase credentials.

For the React Native project, also run:

~~~powershell
npx tsc --noEmit
git diff --check
~~~

Independent reviewer approval remains necessary before merging PR #12.
