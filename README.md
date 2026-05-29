# InterviewPrep AI

Complete SaaS platform for interview preparation with CV analysis, motivation letter support, interview simulations, practical exercises, and final reports.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: Email/password + JWT
- Payments: Stripe Checkout (server-side verification)
- Uploads: Multer (CV + letter files)
- AI: OpenAI text, audio, and structured response workflows

## Project Structure
- `backend/`: API, auth, upload, business logic, report generation
- `frontend/`: Responsive dashboard UI and full user flows
- `docs/`: Database schema, API routes, AI prompt examples

## Run Locally
1. Backend setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Required billing env vars in `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/interviewprep-ai
JWT_SECRET=your_long_random_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
APP_URL=http://localhost:5173
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_TTS_MODEL=tts-1
OPENAI_TRANSCRIPTION_MODEL=whisper-1
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview-2024-10-01
```

2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Optional frontend env var:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

3. Open `http://localhost:5173`

## Freemium Logic
- Free plan:
  - 1 CV analysis
  - 1 interview simulation
- Premium plan:
  - Unlimited simulations
  - Practical exercises
  - Full CV optimization suggestions
  - PDF report downloads

Premium upgrade is payment-gated:
- User clicks `Upgrade to Premium`
- Frontend redirects to Stripe Checkout
- Backend verifies successful Stripe checkout session before updating plan

## Admin Dashboard
- Admin-only user management dashboard at `/app/admin`
- Activate/deactivate user accounts
- Grant/revoke premium access manually after payment checks
- Configure admin accounts with `ADMIN_EMAILS` in backend `.env` (comma-separated)

## Core Endpoints
- Auth: `/api/auth/*`
- CV: `/api/cv/*`
- Letters: `/api/letters/*`
- Interview: `/api/interviews/*`
- Practical: `/api/practical/*`
- Report: `/api/reports/*`
- Billing: `/api/billing/*`
- Admin: `/api/admin/*`
- Voice: `/api/voice/*`

See full endpoint details in `docs/api-routes.md`.
