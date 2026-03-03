# SideFlip Backup and Restore Runbook

## Scope
- Supabase Postgres data (primary source of truth)
- Supabase storage buckets (if/when used for uploads)
- Vercel environment variables
- Clerk configuration snapshot

## RPO / RTO Targets
- RPO (max data loss): 24 hours
- RTO (target restore time): 4 hours

## Ownership
- Primary: product admin (`ADMIN_CLERK_USER_IDS`)
- Secondary: trusted maintainer with Supabase + Vercel + Clerk access

## Backup Policy
1. Database: enable daily Supabase backups + point-in-time recovery (if plan supports).
2. Weekly logical export:
   - `pg_dump --schema-only` for schema versioned snapshot
   - `pg_dump --data-only --inserts` for cold restore fallback
3. Weekly storage export (if buckets are used).
4. Weekly environment snapshot:
   - export Vercel env names + last updated timestamp
   - do not store secrets in plaintext in Git.
5. Monthly Clerk config snapshot:
   - sign-in/sign-up settings
   - webhook endpoints + secrets rotation status

## Restore Drill (Monthly)
1. Create a temporary Supabase project.
2. Apply schema snapshot.
3. Restore latest logical data dump.
4. Run app against restored DB with a temporary `.env`.
5. Validate smoke checklist:
   - `/browse`, `/beta`, `/listing/[id]` load
   - sign-in works
   - create listing succeeds
   - create beta test succeeds
   - admin dashboard queues load
6. Record drill duration and issues.
7. Delete temporary project.

## Incident Restore Procedure
1. Freeze writes (maintenance mode or revoke create routes temporarily).
2. Confirm failure mode:
   - accidental deletes
   - schema corruption
   - credential leak
3. Choose restore point:
   - point-in-time restore preferred
   - fallback to latest logical export
4. Restore database and rotate exposed keys:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Clerk webhook secret
   - Razorpay secret
5. Redeploy with updated secrets on Vercel.
6. Run production smoke checks.
7. Post-incident report:
   - root cause
   - affected window
   - data-loss estimate
   - preventive actions

## Monthly Checklist
- [ ] Backup job completed successfully
- [ ] Latest schema export stored
- [ ] Latest data export stored
- [ ] Restore drill executed
- [ ] Secret rotation audit completed
- [ ] Incident contact list verified
