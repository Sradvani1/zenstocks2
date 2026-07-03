# ZenStocks

A mobile-first portfolio progressive web app. Track holdings, view daily end-of-close performance, read AI-curated news briefings, and chat with a portfolio-aware financial analyst.

**Status:** Phase 1 merged to `main` ([PR #1](https://github.com/Sradvani1/zenstocks2/pull/1)). **Next:** Phase 2 — Auth (email + Google).

## Documentation

| Doc | Description |
|-----|-------------|
| [Product spec](docs/SPEC.md) | Vision, architecture, data model, sprint phases |
| [Environment variables](docs/ENV.md) | All env vars by phase and platform |
| [Phase 1 plan](docs/plans/phase-1.md) | PWA shell + Firebase/Vercel wiring (complete) |
| [Sprint index](docs/plans/README.md) | Phase status and links |

## Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Serwist PWA
- **Hosting:** Vercel
- **Backend:** Firebase Auth, Firestore, Cloud Functions (later phases)

## Local development

```bash
npm install
cp .env.example .env.local   # fill NEXT_PUBLIC_FIREBASE_* from Firebase console
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Test at a 390px viewport for mobile layout.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Prettier write |

## Project setup (one-time)

1. ~~Create GitHub repo `zenstocks2`~~ ✅
2. Create Firebase project `zenstocks2` (Blaze plan)
3. Enable Auth (Email + Google) and Firestore
4. Link repo to Vercel; add `NEXT_PUBLIC_FIREBASE_*` env vars
5. Deploy Firestore rules: `firebase deploy --only firestore:rules`

Firebase emulators for Auth, Firestore, and Functions are introduced in later phases — see [docs/SPEC.md](docs/SPEC.md).

## Sprint phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | PWA shell, Firebase/Vercel wiring, CI | Complete ([PR #1](https://github.com/Sradvani1/zenstocks2/pull/1)) |
| 2 | Auth (email + Google) | **Next** |
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
