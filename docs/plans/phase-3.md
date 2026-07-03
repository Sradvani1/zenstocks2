# Phase 3 — Holdings Management

**Status:** ✅ Complete — closed out 2026-07-03  
**Merge commit:** `a5de61d` on `main`  
**Parent spec:** [SPEC.md](../SPEC.md) §4.2, §5, §7, §9 Phase 3  
**Branch:** `phase-3/holdings` (merged)

**Goal:** Users can add, edit, and delete holdings (symbol + shares) on `/holdings`; data persists in Firestore; `symbols/active` registry updates via trigger; security rules enforce per-doc validation.

**Depends on:** Phase 2 complete ([phase-2.md](phase-2.md)) — `AuthProvider`, `RequireAuth`, `bootstrapUserDoc`, owner-only `users/{uid}` rules.

---

## Sharpening decisions (locked)

| Decision | Resolution |
|----------|------------|
| 25-symbol cap | **Client-only** (`onSnapshot.length` + UI `atLimit`) |
| Rules 25-cap | **Not in rules** — per-doc shape validation only |
| Shares input | **Integers ≥ 1** |
| Share edit save | **On blur / Enter** |
| `/holdings` back link | **Always `/user`** |
| Rules unit tests | **Manual verification only** |

---

## Principle

**Minimum code only** ([AGENTS.md](../../AGENTS.md)). Reuse Firebase primitives (`onSnapshot`, `getCountFromServer`). No new auth layers, no middleware. Do **not** touch `src/lib/firebase/client.ts`.

---

## Deliverables

| Area | Implementation |
|------|----------------|
| `/holdings` | CRUD form (≤25 symbols), optimistic UI via `useHoldings` |
| Firestore | `users/{uid}/holdings/{symbol}` — doc ID = uppercase symbol |
| Rules | Per-doc validation (symbol regex, integer shares ≥ 1, owner, immutable symbol). No 25-cap in rules |
| Cloud Function | `functions/node` + `onHoldingWrite` → `symbols/active` holderCount |
| Redirect | `page.tsx`: `getCountFromServer` → 0 holdings → `/holdings`, else `/folio` |
| User | `/user`: "Update holdings" link → `/holdings` |

---

## Files

| File | Action |
|------|--------|
| `src/lib/symbols.ts` | Create — normalize, validate, `MAX_HOLDINGS=25` |
| `src/types/holding.ts` | Create |
| `src/hooks/useHoldings.ts` | Create — onSnapshot + optimistic CRUD |
| `src/app/holdings/page.tsx` | Replace stub with CRUD UI |
| `src/app/page.tsx` | Post-auth redirect via `getCountFromServer` |
| `src/app/(tabs)/user/page.tsx` | "Update holdings" link |
| `firestore.rules` | Holdings validation + `symbols/active` deny |
| `functions/node/*` | Scaffold + `onHoldingWrite` |
| `firebase.json` | Add functions config |

**No changes:** `src/lib/auth.ts`, `src/lib/firebase/client.ts`

---

## Pre-flight (manual, before merge)

- Firebase Console: Blaze plan (required for Cloud Functions)
- `firebase deploy --only firestore:rules,functions:node:onHoldingWrite`

---

## Verification checklist

- [x] `npm run lint && npm run typecheck && npm run build`
- [x] Add holding → persists after refresh (local + deployed rules)
- [x] `/user` → "Update holdings" → `/holdings`
- [x] `firebase deploy --only firestore:rules` (required for holdings permissions)
- [ ] Post-auth redirect (0 holdings → `/holdings`, else `/folio`) — preview smoke test
- [ ] `firebase deploy --only functions:node:onHoldingWrite` — requires Blaze plan; codebase prefix `node` matches `firebase.json`
- [ ] `symbols/active` holderCount in Firestore console after add/delete

---

## Handoff to Phase 4

Per [ADR 0002](../adr/0002-fixed-symbol-universe.md):

- Seed `symbols/universe` (~100 largest US equities) + deploy script
- Daily pipelines iterate **universe**, not `symbols/active`
- `symbols/active` (from `onHoldingWrite`) retained for holder counts only
- Add `quotes/*` and `symbols/universe/*` authenticated read rules; holdings must be universe members
- Replace free-text symbol entry on `/holdings` with universe picker/autocomplete
- Pending quote UI when today's batch has not yet written `quotes/{symbol}`
