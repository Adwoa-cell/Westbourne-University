# Supabase setup (Phase 2)

You can run the whole public website without Supabase (demo mode). Do this guide when you want real accounts and a real database.

## What Supabase does here
- **PostgreSQL**: stores all data. Rules (Row Level Security, "RLS") run inside the database.
- **Auth**: sign-up, email verification, password reset, session tokens (JWTs).
- **Storage**: private bucket for application documents (used from Phase 3).

Cost: Supabase has a free plan that is enough for a student project. Free projects have size limits and may be paused after a period of inactivity; check https://supabase.com/pricing for current limits. Nothing in this guide requires a paid plan, and nothing here creates AWS resources.

## 1. Create the project
1. Sign in at https://supabase.com and create a new project. Choose a region near your users.
2. Set a strong database password and store it in a password manager. You will not need it in the app.

## 2. Configure authentication (Authentication section of the dashboard)
- **Email provider**: keep "Confirm email" turned ON. The backend also refuses users whose email is unverified.
- **Password policy**: set the minimum password length to 12 (the frontend also checks 12).
- **URL configuration**: Site URL `http://localhost:5173`. Add these Redirect URLs:
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/reset-password`
  Verification and reset links only work for addresses on this allow-list. Add your production URLs later.
- **Email sending**: the built-in sender is meant for testing and allows only a few emails per hour. For real use, configure your own SMTP provider.
- **Rate limits**: review the Auth rate-limit settings; Supabase applies them to sign-up and sign-in.

## 3. Create the database objects
Open **SQL Editor**, then paste and run each file completely, in this order:
1. `database/migrations/001_core_schema.sql`
2. `database/migrations/002_functions_triggers.sql`
3. `database/migrations/003_rls_policies.sql`
4. `database/seed/001_reference_data.sql` (fictional programmes, courses, calendar)

If a migration stops with an error, read the message, fix the cause, and re-run only that file after dropping what it half-created (or reset the project while it is still empty).

## 4. Copy the keys (Project Settings, API)
| Value | Goes in | Secret? |
|-------|---------|---------|
| Project URL | `backend/.env` `SUPABASE_URL` and `frontend/.env` `VITE_SUPABASE_URL` | No |
| `anon` key (newer dashboards call it "publishable") | `backend/.env` `SUPABASE_ANON_KEY` and `frontend/.env` `VITE_SUPABASE_ANON_KEY` | Public by design |
| `service_role` key (newer dashboards call it "secret") | `backend/.env` `SUPABASE_SERVICE_ROLE_KEY` ONLY | **YES. Never in frontend, Git, screenshots or chats** |

The service-role key bypasses every RLS rule. If it ever leaks, rotate it in the dashboard immediately.

```bash
cp backend/.env.example backend/.env     # then edit
cp frontend/.env.example frontend/.env   # then edit
```
Restart both servers. The backend prints `data source: supabase` when it is connected.

## 5. Create the first administrator securely
There is deliberately no public way to become an administrator.
1. Open the website, go to **Create an account**, register with your own email, and click the verification link.
2. In the Supabase SQL Editor open `database/seed/promote_user.sql`, replace the email, keep `v_role` as `administrator`, and run it. The SQL Editor runs as the trusted `postgres` role, which is why this works.
3. Do not save the edited file into Git.
4. Sign out and in again. **My account** now shows Administrator.

After that, administrators can assign roles through the API (`PATCH /api/v1/admin/users/:id/role`). The database function refuses non-administrators and refuses self-changes. To make a test student, sign up another account and run `promote_user.sql` with `v_role := 'student'`.

## 6. Run the database security tests
Paste `database/tests/rls_tests.sql` into the SQL Editor and run it. Every notice should start with `PASS`. It runs inside a transaction that is rolled back, so it leaves no data behind. Run it again after any change to a policy.

## 7. Quick checks
```bash
curl http://localhost:4000/health
curl "http://localhost:4000/api/v1/programmes?pageSize=3"
curl -i http://localhost:4000/api/v1/me          # expect 401
```
In the app: register, verify, sign in, edit your name on **My account**, sign out. Try **Forgot your password?** too.

## Backups
Free projects do not include the same backup features as paid plans. Before you store anything you care about: export with `pg_dump` (Supabase dashboard shows the connection string under Database settings), or enable a paid plan with daily backups. Test a restore at least once. This is covered again in the AWS phase.

## Troubleshooting
- **"Sign-in is not set up yet"**: the frontend `.env` is missing or you did not restart `npm run dev`.
- **Verification link says invalid or goes to the wrong site**: check Site URL and Redirect URLs in step 2.
- **Backend refuses to start with DATA_SOURCE error**: `backend/.env` still has placeholder keys.
- **`/api/v1/me` returns 401 after sign-in**: the token is for a different project than `SUPABASE_URL`.
- **Sign-up emails do not arrive**: check spam, then the built-in email rate limit.
- **Role did not change on the Account page**: sign out and in again, or reload.
