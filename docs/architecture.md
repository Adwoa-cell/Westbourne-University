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

## Current state (Phase 1)

Public pages read FICTIONAL demo data from `backend/src/data/demoData.js` through real API endpoints. In Phase 2 the controllers switch to Supabase queries and the response shapes stay the same.
The contact form is stored in `backend/storage/contact-messages.jsonl` (gitignored) until the database exists.

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

## Phase 1 security measures and limits

Done: Helmet security headers, CORS allow-list, request size limit (10 KB), global and contact rate limits, zod validation, generic 500 errors, no secrets in code, `.env` ignored by Git.
Not yet: authentication, authorisation, database policies, audit logs, file uploads. These arrive in later phases. Nothing here has been penetration tested.
