# ADR 0002: Fixed symbol universe (top ~100) drives pipelines

**Status:** Accepted  
**Date:** 2026-07-03  
**Spec reference:** [SPEC.md](../SPEC.md) §3, §4.2, §5, §6, §7, §9 Phase 4, §16

## Context

The original spec used a **demand-driven** model: daily yfinance, news, and fundamentals jobs iterated `symbols/active`, a registry populated when users added holdings (`onHoldingWrite`). Users could enter any valid US ticker regex.

Product intent is different:

- Start with the **~100 largest US equities** as the only symbols users may hold.
- **Pre-warm** shared market data (quotes, history, fundamentals, articles) for the full universe every trading day — not only symbols someone currently owns.
- Universe may **expand later** (add docs to `symbols/universe`); no architectural change required.

Shared per-symbol data (`quotes/*`, `articles/*`) was already global in the spec. This ADR locks **how the universe is defined** and **what schedulers iterate**.

## Decision

### 1. Add `symbols/universe/{symbol}` — source of truth for pickable stocks

```
symbols/universe/{symbol}
  symbol: string              // document ID = uppercase ticker
  name: string                // display name (e.g. "Apple Inc.")
  rank: number                // 1–100 at launch; stable sort for UI
  addedAt: timestamp          // when symbol entered universe
```

- **Launch size:** 100 symbols (largest US equities by market cap; exact list in seed data, not hardcoded in app).
- **Expansion:** Add new docs via seed script or admin process; pipelines pick them up on the next run.
- **Client:** Authenticated read for holdings picker / autocomplete on `/holdings`.
- **Rules:** Holding create/update requires `exists(symbols/universe/{symbol})`.

### 2. Daily pipelines iterate `symbols/universe`, not `symbols/active`

| Job | Iterates |
|-----|----------|
| `refreshMarketData` (Python) | `symbols/universe` |
| `enrichFundamentals` (Node) | `symbols/universe` |
| `generateDailyArticle` (Node) | `symbols/universe` |

Writes go to existing shared collections: `quotes/{symbol}`, `quotes/{symbol}/history/{date}`, `quotes/{symbol}/fundamentals/latest`, `articles/{symbol}/{date}`.

Fixed cost: ~100 symbols/day — acceptable for a personal app with predictable UX.

### 3. Keep `symbols/active` — usage tracking only

`onHoldingWrite` (Phase 3) **continues** to maintain `symbols/active/{symbol}` with `holderCount` and `lastRequestedAt`.

| Collection | Role |
|------------|------|
| `symbols/universe` | **What** may be held; **what** pipelines refresh |
| `symbols/active` | **Who** holds what (counts for analytics, `onUserDelete` cascade, future cost trimming) |

Schedulers do **not** gate on `holderCount > 0`.

### 4. Holdings UX and validation

- `/holdings`: picker or autocomplete from `symbols/universe` (not free-text any ticker).
- Regex validation remains as a secondary guard; universe membership is the primary gate.
- Pending quote message applies only when today's batch has not yet written `quotes/{symbol}` — not because the symbol was never ingested.

### 5. Seed and governance

- Universe list lives in repo seed data (e.g. `data/universe.json`) and is deployed to Firestore via a one-time or CI seed step in **Phase 4** (before first `refreshMarketData` run).
- Changing the universe requires updating seed data + redeploy seed — not a user-facing feature at launch.

## Consequences

- **Phase 3** (shipped): free-text symbol entry and `onHoldingWrite` → `symbols/active` remain valid; universe enforcement lands in **Phase 4** alongside seed + picker UI.
- **Phase 4** must deliver: universe seed, `symbols/universe` rules, holdings rules/UI update, pipeline iteration over universe.
- **SPEC §4.2** "enforced in security rules" for 25-cap unchanged; universe is a separate rule (`exists` on universe doc).
- Supersedes demand-driven ingestion described in original SPEC §3 write/ingestion paths and §16 row "New symbol data | Wait for next daily batch" for universe members (data is batch-refreshed daily regardless of holdings).
- Principle "scheduled jobs only for symbols in at least one portfolio" (§1) is replaced by "scheduled jobs for all universe symbols."

## Alternatives considered

| Option | Why not |
|--------|---------|
| Demand-driven only (`symbols/active`) | Cold start when user adds ticker; conflicts with fixed product universe |
| Universe in env / hardcoded TS array | Harder to expand; no single Firestore source for rules `exists()` check |
| Drop `symbols/active` | Lose holder counts useful for `onUserDelete` and future analytics |

## Implementation phases (summary)

| Phase | Work |
|-------|------|
| 3 (done) | Holdings CRUD; `onHoldingWrite` → `symbols/active` |
| 4 | Seed `symbols/universe`; pipelines over universe; rules; `/holdings` picker |
| 5+ | Read `quotes/*` for dashboard; pending state = missing/stale quote for today |
