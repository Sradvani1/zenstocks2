# Environment Variables

Reference for all environment variables used across zenstocks2. **Never commit real values** — use `.env.local` locally and platform dashboards for deployed environments.

## Local development

Copy `.env.example` to `.env.local` and fill in values from the Firebase console.

```bash
cp .env.example .env.local
```

## Vercel (public — embedded in client bundle)

| Variable | Required | Phase | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | 1 | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | 1 | Firebase Auth domain (`{project}.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | 1 | Firebase project ID (`zenstocks2`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | 1 | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | 1 | Firebase Cloud Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | 1 | Firebase web app ID |

## Vercel (server-only)

| Variable | Required | Phase | Description |
|----------|----------|-------|-------------|
| `OPENAI_API_KEY` | Yes | 9 | OpenAI API key for chat and vector store |
| `OPENAI_VECTOR_STORE_ID` | Yes | 9 | Shared app vector store ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | 9 | Firebase Admin SDK credentials (JSON string) for token verification and Firestore writes from `/api/chat` |
| `CRON_SECRET` | Yes | 9 | Bearer token protecting `/api/cron/*` routes |

## Firebase Secret Manager (Cloud Functions)

| Secret | Required | Phase | Description |
|--------|----------|-------|-------------|
| `GEMINI_API_KEY` | Yes | 7 | Google AI Studio API key for news generation and fundamentals enrichment |

## CI / deployment (not in `.env.local`)

| Variable | Where | Description |
|----------|-------|-------------|
| `FIREBASE_TOKEN` or service account | GitHub Actions (optional) | Firebase CLI deploy credentials |
| Dummy `NEXT_PUBLIC_FIREBASE_*` | GitHub Actions workflow | Placeholder values so `npm run build` passes without secrets |

## Environments

| Environment | Firebase | Vercel | Notes |
|-------------|----------|--------|-------|
| Local | Emulator suite (Phase 4+) | `npm run dev` | Use emulators for Functions development |
| Production | Single project `zenstocks2` | Production + PR previews | PR previews share the same Firebase project |

See [SPEC.md §10](SPEC.md) for full deployment notes.
