# Westbourne University: architecture

```
 Browser (React app)
   |  1. loads static files (HTML, JS, CSS)
   v
 CDN / static host  (AWS Amplify or S3 + CloudFront)           <- frontend/ build output
   |
   |  2. JavaScript calls  https://<api>/api/v1/...   (JSON over HTTPS)
   v
 Express API  (Node.js on AWS App Runner)                      <- backend/
   |  3. validates input, checks who you are and what you may do
   v
 Supabase  (PostgreSQL + Auth + Storage)                       <- database/
```

## What each part does

| Part | Job | Why it exists |
|------|-----|---------------|
| React + Vite (frontend) | Draws pages, collects input, calls the API | Runs in the user's browser, so it can never be trusted with secrets or access decisions |
| Express (backend) | The only code that applies business rules (credit limits, prerequisites, who may edit grades) | Rules enforced here cannot be bypassed by editing the browser |
| PostgreSQL (Supabase) | Stores all records and enforces Row Level Security | A second lock: even a backend bug cannot expose another student's data |
| Supabase Auth | Sign-up, email verification, password reset, sessions | Avoids writing password handling ourselves |
| AWS | Hosts the built frontend and the backend container | Public, HTTPS, logs and monitoring |

## Request flow (a student opens Programmes)

1. The browser loads the React app from the static host.
2. The Programmes page calls `GET /api/v1/programmes?faculty=fet`.
3. Express applies security headers, CORS and rate limiting, then validates the query with zod.
4. The controller finds matching programmes and returns `{ data, meta }` JSON.
5. React renders the cards. React escapes text by default, which blocks most cross-site scripting.

In development, Vite (port 5173) forwards `/api` to Express (port 4000), so the browser only talks to one origin.

## Trust boundaries (important for security)

- Anything in `frontend/` is public. Only `VITE_` variables are bundled, and none may be secret.
- The Supabase service-role key will live only in the backend environment (Phase 2).
- The backend never trusts a role or user ID sent by the browser; it will derive identity from a verified Supabase token.

## Current state

Public pages can use demo data or Supabase-backed repositories, depending on backend configuration. The authenticated administrator screens use Supabase through the Express API and the signed-in user's database client. The contact form uses the configured repository.

## API endpoints in Phase 1

| Method | Path | Notes |
|--------|------|-------|
| GET | /health | Liveness check |
| GET | /api/v1/faculties | |
| GET | /api/v1/programmes | `q`, `faculty`, `qualification`, `studyMode`, `page`, `pageSize` |
| GET | /api/v1/cutoff-points | `q`, `academicYear`, `page`, `pageSize` |
| GET | /api/v1/announcements | `category`, `page`, `pageSize` |
| GET | /api/v1/events | |
| GET | /api/v1/admissions/info | Requirements, steps, deadlines, FAQs |
| POST | /api/v1/contact | Validated, rate limited (5 per hour per IP), honeypot-protected |

Errors always look like `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { ... } } }`.

## Administrator management

The `/admin` React routes require a verified signed-in user whose database profile role is `administrator`. Every `/api/v1/admin/*` endpoint applies the same authentication and role middleware. Administrative queries use the caller's Supabase JWT, so the existing RLS policies remain active; the browser never receives a service-role key.

| Method | Path | Notes |
|--------|------|-------|
| GET | /api/v1/admin/faculties | Returns faculty UUIDs for programme assignment |
| GET, POST | /api/v1/admin/programmes | List and create programmes |
| PATCH | /api/v1/admin/programmes/:id | Edit programme fields |
| PATCH | /api/v1/admin/programmes/:id/status | Activate or deactivate a programme |
| GET | /api/v1/admin/applications | Paginated list, optionally filtered by status |
| GET | /api/v1/admin/applications/:id | View application, status history and documents through short-lived private-storage links |
| PATCH | /api/v1/admin/applications/:id/status | Apply an allowed admissions workflow transition |
| GET | /api/v1/admin/students | Paginated student listing, optionally searched by student number |
| GET | /api/v1/admin/students/:id | View a student record |
| GET, POST | /api/v1/admin/calendar-events | List and create calendar events |
| PATCH | /api/v1/admin/calendar-events/:id | Edit a calendar event |

These features use the tables and administrator RLS rules already defined in migrations `001_core_schema.sql` and `003_rls_policies.sql`; they do not require a new migration. Application status transitions also pass through the database workflow guard in `002_functions_triggers.sql`.

## Security measures and limits

Implemented: Helmet security headers, CORS allow-list, request size limit (10 KB), rate limits, Zod validation, generic 500 errors, verified Supabase authentication, database-backed roles, administrator authorization, RLS policies and audit triggers. Application documents use private storage and are not directly exposed as public URLs. Nothing here has been penetration tested.
