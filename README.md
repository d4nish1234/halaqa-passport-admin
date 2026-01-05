# Halaqa Passport Admin

Admin dashboard for managing halaqa series, QR check-ins, and attendance analytics for the Halaqa Passport mobile app.

## Features
- Google sign-in with Firebase Auth
- Admin override via `ADMIN_EMAIL`
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

ADMIN_EMAIL=admin@example.com
```

3) Enable Google sign-in in Firebase

In Firebase Console → Authentication → Sign-in method, enable the Google provider for the project.

4) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Firestore collections
- `series`: `{ name, startDate, isActive, completed, createdBy, createdAt }`
- `sessions`: `{ seriesId, startAt, checkinOpenAt, checkinCloseAt, token, createdBy, createdAt }`
- `participants` collection stores `{ nickname }` documents
- `attendance`: `{ participantId, seriesId, sessionId, timestamp }`

## Auth + security
- Client uses Firebase Auth (Google) to obtain an ID token.
- Server creates a session cookie.
- Admin pages are protected server-side; middleware only enforces cookie presence.
- `ADMIN_EMAIL` can access all series/sessions; other users only see and manage their own.
- No admin credentials are shipped to the client.

## Vercel deployment notes
- Add the same environment variables from `.env.local` in the Vercel project settings.
- Ensure the Firebase Admin private key is stored with newline escapes (`\n`).
- The app uses standard Node.js runtimes (no Edge admin routes).
