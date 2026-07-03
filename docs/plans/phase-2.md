# Phase 2 — Authentication

**Status:** ✅ Complete — closed out 2026-07-03  
**Initial merge:** [PR #2](https://github.com/Sradvani1/zenstocks2/pull/2) (`5f65d05`)  
**Final auth commit:** `20e5359`  
**Parent spec:** [SPEC.md](../SPEC.md) §4.1, §5, §7, §9 Phase 2  
**Branch:** `phase-2/auth` (merged)

**Goal:** Firebase Auth (email + Google sign-in, sign out) with route guards on tab routes and `/holdings`. Bootstrap `users/{uid}` in Firestore on first sign-in. Phase 1 shell stays intact.

---

## Principle (locked for all future phases)

**Use the minimum code required.** Firebase owns auth state — react to `onAuthStateChanged` only. No middleware, no custom session layer, no redirect caching, no `auth.currentUser` workarounds, no competing navigation in sign-in handlers.

---

## Final implementation

| Topic | Choice |
|-------|--------|
| Auth state | `onAuthStateChanged` in `AuthProvider` — single source of truth |
| Google | `signInWithPopup` (Firebase Web SDK default) |
| Email | `signInWithEmailAndPassword` / `createUserWithEmailAndPassword` |
| Sign out | `signOut(auth)` — listener clears `user`; guards handle routing |
| Post-auth navigation | One `useEffect` on `/` when `user` becomes non-null → `/folio` |
| Protected routes | `RequireAuth` client wrapper — `user` null → `/` |
| Bootstrap | `bootstrapUserDoc` from `onAuthStateChanged`, idempotent `setDoc` merge |
| Firestore rules | `users/{uid}` owner-only |
| Auth helpers | One file: `src/lib/auth.ts` (`bootstrapUserDoc`, `AUTH_ERRORS`) |
| Landing UI | shadcn `Tabs` + `Input` / `Label` / `Button` |
| Guards | `AuthProvider` + `RequireAuth` — **no Next.js middleware** |

**Explicitly not used:** `signInWithRedirect`, `getRedirectResult`, `resolvePostAuthPath`, `isNewUser` routing, holdings count queries, Firebase Admin SDK.

**Deferred to Phase 3:** new-user vs returning-user redirect (`/holdings` vs `/folio`) once holdings CRUD exists.

---

## Architecture

```
Landing (/)          → Firebase sign-in SDK calls only
AuthProvider         → onAuthStateChanged → user + loading
                     → bootstrapUserDoc on sign-in
(tabs)/layout        → RequireAuth → AppShell
/holdings            → RequireAuth (standalone stub)
/user                → email, provider, signOut(auth)
```

Navigation is driven by auth state, not by imperative redirects inside sign-in handlers.

---

## Files

| File | Role |
|------|------|
| `src/lib/auth.ts` | `bootstrapUserDoc`, `AUTH_ERRORS` |
| `src/components/auth/AuthProvider.tsx` | `onAuthStateChanged`, `useAuth()` |
| `src/components/auth/RequireAuth.tsx` | Skeleton while loading; redirect `/` if no `user` |
| `src/app/layout.tsx` | `<AuthProvider>` wrapper |
| `src/app/page.tsx` | Landing auth UI |
| `src/app/(tabs)/layout.tsx` | `<RequireAuth>` |
| `src/app/holdings/page.tsx` | Protected stub |
| `src/app/(tabs)/user/page.tsx` | Profile + sign out |
| `firestore.rules` | `users/{uid}` owner read/write |

**Untouched:** `src/lib/firebase/client.ts`, tab stubs, `BottomNav`, `AppShell`.

---

## Post-merge fixes (main)

| Commit | Fix |
|--------|-----|
| `dd66388` | Static `process.env.NEXT_PUBLIC_*` — dynamic env access broke client Firebase config in production |
| `2a55c59` | Removed over-engineered Google redirect race handling (later superseded) |
| `29c6a78` | Redirect loop workaround (`auth.currentUser`) — symptom fix, superseded |
| `20e5359` | **Final:** pure `onAuthStateChanged` flow; `signInWithPopup`; auth state drives navigation |

---

## Pre-flight (manual)

- Firebase Console: Email/Password + Google enabled
- Authorized domains: `localhost`, `zenstocks2.vercel.app`, Vercel preview hostname
- `firebase deploy --only firestore:rules` (deployed)

---

## Verification checklist

- [x] `npm run lint && npm run typecheck && npm run build`
- [x] Email sign-in / sign-up → `/folio`
- [x] Google sign-in (`signInWithPopup`) on preview
- [x] Sign out from `/user` → `/`
- [x] Unauthenticated `/folio` → `/`
- [x] `users/{uid}` doc in Firestore on first sign-in
- [x] No bottom nav on `/` or `/holdings`

---

## Handoff to Phase 3

Phase 3 adds holdings CRUD on `/holdings`. When that ships:

- Add `getCountFromServer` or equivalent for post-auth redirect (new / empty portfolio → `/holdings`, else `/folio`)
- Add `users/{uid}/holdings/*` Firestore rules
- Link from `/user` to holdings management

Do not reintroduce redirect complexity until Phase 3 needs it.
