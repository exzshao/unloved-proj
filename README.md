# Unloved MVP

Quickstart

1. Copy .env.example to .env and fill values.
2. Create Postgres database and run db/schema.sql.
3. Install deps and start dev server:
   - npm install
   - npm run dev
4. OTP
   - For local dev, keep MOCK_OTP=true and use code 000000.
   - For production, set Twilio Verify env vars and set MOCK_OTP=false.

Pages
- / : Page 1 (enter phone, OTP, verify)
- /page2 : Page 2 (enter the other's number)
- /page3 : Page 3 (status: waiting/matched)

API
- POST /api/otp/send { phone }
- POST /api/otp/verify { phone, code }  -> sets session cookie
- POST /api/submissions { target_phone }
- GET  /api/status -> { state: "waiting" | "matched", matchedAt?, submittedAt? }

Session & State Persistence
- JWT-based session cookie (30 days, HttpOnly, SameSite=Lax)
- Middleware automatically routes users based on their progress:
  - No session → redirected to / (login)
  - Logged in, no submission → redirected to /page2 (enter target)
  - Logged in, has submission → redirected to /page3 (timer/match status)
- Timer persists across browser relaunch and multi-device login
- Timer is calculated from server-side submission timestamp
