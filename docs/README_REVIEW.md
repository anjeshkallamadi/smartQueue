# SmartQueue PR #12 — review fixes

Prepared 2026-10-20 from the connected **SmartQueue** Supabase project's PostgreSQL catalogs and the current `feature/admin-dashboard` GitHub branch. **No live database schema or repository files were modified while preparing this package.**

## Package contents

- `supabase/migrations/20261020000000_smartqueue_baseline.sql` — baseline schema migration for a **fresh Supabase project**.
- `src/app/home.tsx` — removes the development-only `/queue-test` navigation button. Other Home features remain.
- `styles/homeStyles.ts` — removes unused `testButton` and `testButtonText` styles.

Copy these paths into your local repository (preserving the folders) on `feature/admin-dashboard`, then examine the changes with `git diff` before committing.

## Captured database objects

- 5 tables and their observed data types, nullability, defaults, foreign keys, primary keys, and table comments.
- Partial unique index for one active queue entry per user/queue; unique `(queue_id, token_number)` index; service owner index.
- 10 app-callable SQL functions: `is_queue_admin`, `can_manage_queue`, `join_queue_secure`, `get_my_queue_position`, `get_queue_now_serving`, `get_my_managed_queues`, `admin_call_next`, `admin_skip_current`, `admin_pause_queue`, and `admin_resume_queue`.
- 2 trigger helpers: `handle_new_user`, `signal_queue_entry_change`; triggers on `auth.users` and `public.queue_entries`.
- RLS and client grants, plus adding `public.queues` to `supabase_realtime` publication (when publication exists).

**No rows from application tables or Supabase Auth were exported.** Sample users, service records, and admin ownership assignments are **not included**. A new database will need test users and an owner-assigned service/active queue to reproduce the mobile demo.

## Important differences from the live project's legacy grants/policies

The SQL is based on deployed schema and function definitions, but it is **not a byte-for-byte permissions dump**. The current live project still has broad historical table privileges (including `TRUNCATE` for some app roles) and legacy queue-entry INSERT/UPDATE and admin-notification policies. These are not needed for secure RPC-based queue management, and `TRUNCATE` bypasses RLS.

The **fresh-database baseline intentionally restricts** `anon` and `authenticated` table privileges to required operations, removes obsolete direct queue-entry mutation policies, and defers notification creation. This is a proposed security hardening, not a change already applied to the live project. **Reviewer should approve these differences**; permissions in the live project should be reconciled in a separately reviewed migration, rather than silently assumed consistent.

The live project also has `queues.status DEFAULT 'waiting'` despite app logic using `'active'` for joinable queues. The baseline preserves this deployed default. Future queue-creation functions should explicitly set `status` and enforce ownership. No service-creation, queue-creation, or notification-generation RPCs are included.

## IMPORTANT: Do not run the baseline against the current live database

This migration uses `CREATE TABLE` and targets a new project. The existing linked database **already contains** these tables. Running this file directly in its SQL Editor, or running `db push` against the existing project without correctly baselining migration history, will fail or risk overwriting your workflow. Do not run `db reset` against any database containing records you want to keep.

To establish this as the initial migration in the currently deployed Supabase project, after reviewer approval use the official Supabase CLI migration-history workflow and verify it does not reapply the baseline. Marking migration history is a separate controlled step. `supabase db pull` with Docker is the preferred definitive export when available.

## Local checks before asking for another review

In the project root:

```powershell
npx tsc --noEmit
git diff --check
git status
```

On a fresh, isolated Supabase environment with a compatible auth schema, a reviewer should apply the migration and test: signup trigger; normal user's row access and join; second-join idempotency; concurrent joins; non-owner admin RPC denial; owner Call Next/Skip/Pause/Resume; Realtime events; queue position; notifications visibility. **This fresh-database apply was not executed here because Docker/local PostgreSQL is not available.**

After checks, stage only these paths:

```powershell
git add supabase/migrations/20261020000000_smartqueue_baseline.sql src/app/home.tsx styles/homeStyles.ts
git commit -m "Add SmartQueue database baseline and remove test route button"
git push origin feature/admin-dashboard
```

This updates existing PR #12 automatically. Do not stage unrelated `.vscode/settings.json` or untracked `src/app/queue-test.tsx`.
