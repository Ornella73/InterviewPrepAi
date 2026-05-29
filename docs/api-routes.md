# API Routes

Base URL: `http://localhost:5000/api`

## Auth
- `POST /auth/register`
  - body: `{ name, email, password }`
- `POST /auth/login`
  - body: `{ email, password }`
- `GET /auth/me`
  - auth required

## Billing (Stripe)
- `POST /billing/checkout-session`
  - auth required
  - creates Stripe Checkout URL for premium plan purchase
- `GET /billing/status`
  - auth required
  - returns current plan + payment history
- `GET /billing/verify-session?session_id=...`
  - auth required
  - verifies checkout session with Stripe API and upgrades user to premium only when payment is confirmed

## Admin
- `GET /admin/users`
  - auth required
  - admin only
  - list all users with role, account status, plan
- `PATCH /admin/users/:id/access`
  - auth required
  - admin only
  - body: `{ plan?: "free" | "premium", isActive?: boolean }`
  - used to activate/deactivate account and grant/revoke premium access

## CV Analysis
- `POST /cv/analyze`
  - auth required
  - multipart form-data: `cv`
- `GET /cv/history`
  - auth required

## Motivation Letter
- `POST /letters/generate`
  - auth required
  - body: `{ jobTitle }`
- `POST /letters/review`
  - auth required
  - multipart form-data: `letter`
- `GET /letters/history`
  - auth required

## Interview Simulation
- `POST /interviews/start`
  - auth required
  - body: `{ jobTitle, field, level }`
- `POST /interviews/:id/answer`
  - auth required
  - body: `{ answer }`
- `POST /interviews/:id/complete`
  - auth required
- `GET /interviews/history`
  - auth required
- `GET /interviews/:id`
  - auth required

## Practical Exercises
- `POST /practical/generate`
  - auth required
  - premium only
  - body: `{ jobTitle, field, level }`

## Reports
- `GET /reports/:sessionId`
  - auth required
- `GET /reports/:sessionId/pdf`
  - auth required
  - premium only
