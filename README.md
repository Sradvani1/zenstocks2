# ZenStocks

A mobile-first portfolio progressive web app. Track holdings, view daily end-of-close performance, read AI-curated news briefings, and chat with a portfolio-aware financial analyst.

**Status:** Pre-Phase 1 — repository and documentation scaffolding. The Next.js app shell lands in [Phase 1](docs/plans/phase-1.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [Product spec](docs/SPEC.md) | Vision, architecture, data model, sprint phases |
| [Environment variables](docs/ENV.md) | All env vars by phase and platform |
| [Phase 1 plan](docs/plans/phase-1.md) | Current sprint: PWA shell + Firebase/Vercel wiring |

## Stack (target)

- **Frontend:** Next.js 15+, TypeScript, Tailwind CSS, shadcn/ui, Serwist PWA
- **Hosting:** Vercel
- **Backend:** Firebase Auth, Firestore, Cloud Functions (Node + Python)
- **Data:** yfinance (daily batch), Gemini (news), OpenAI (chat)

## Local development

> App scaffolding is not yet in place. After Phase 1 merges:

```bash
npm install
cp .env.example .env.local   # fill NEXT_PUBLIC_FIREBASE_* from Firebase console
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Test at 390px viewport for mobile layout.

Firebase emulators for Auth, Firestore, and Functions are introduced in later phases — see [docs/SPEC.md](docs/SPEC.md).

## Project setup (one-time)

1. Create Firebase project `zenstocks2` (Blaze plan)
2. Enable Auth (Email + Google) and Firestore
3. Link repo to Vercel; add `NEXT_PUBLIC_FIREBASE_*` env vars
4. Deploy Firestore rules after Phase 1: `firebase deploy --only firestore:rules`

## Sprint phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | PWA shell, Firebase/Vercel wiring, CI | In progress |
| 2 | Auth (email + Google) | Planned |
| 3 | Holdings CRUD | Planned |
| 4 | yfinance market data pipeline | Planned |
| 5 | Portfolio dashboard | Planned |
| 6 | Stock detail + charts | Planned |
| 7 | Gemini news pipeline | Planned |
| 8 | News feed UI | Planned |
| 9 | OpenAI chat + vector store | Planned |
| 10 | Production hardening | Planned |

## License

Private — not open source.
