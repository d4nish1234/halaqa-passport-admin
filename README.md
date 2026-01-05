# Halaqa Passport Admin

Admin dashboard for managing halaqa series, QR check-ins, and attendance analytics for the Halaqa Passport mobile app.

## Features
- Google sign-in with Firebase Auth
- Admin allowlist via `ADMIN_EMAIL_ALLOWLIST`
- Series + sessions CRUD (server-side Firestore writes)
- TV mode QR code display with auto refresh
- Attendance analytics + CSV export

## Tech stack
- Next.js (App Router) + TypeScript
- Firebase client SDK (auth)
- Firebase Admin SDK (server-only Firestore access)
- Minimal CSS (no Tailwind dependency)

## Local development
1) Install dependencies

```bash
npm install
```

2) Create `.env.local`

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

ADMIN_EMAIL_ALLOWLIST=admin1@example.com,admin2@example.com
```

3) Enable Google sign-in in Firebase

In Firebase Console → Authentication → Sign-in method, enable the Google provider for the project.

4) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Firestore collections
- `series`: `{ name, startDate, isActive, completed, createdAt }`
- `sessions`: `{ seriesId, startAt, checkinOpenAt, checkinCloseAt, token, createdAt }`
- `participants` collection stores `{ nickname }` documents
- `attendance`: `{ participantId, seriesId, sessionId, timestamp }`

## Auth + security
- Client uses Firebase Auth (Google) to obtain an ID token.
- Server creates a session cookie and verifies allowlist on every admin request.
- Admin pages are protected server-side; middleware only enforces cookie presence.
- No admin credentials are shipped to the client.

## Vercel deployment notes
- Add the same environment variables from `.env.local` in the Vercel project settings.
- Ensure the Firebase Admin private key is stored with newline escapes (`\n`).
- The app uses standard Node.js runtimes (no Edge admin routes).
