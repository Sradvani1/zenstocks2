# Phase 2 — Authentication

**Status:** ✅ Complete — merged to `main` via [PR #2](https://github.com/Sradvani1/zenstocks2/pull/2) on 2026-07-02  
**Merge commit:** `5f65d05`
**Parent spec:** [SPEC.md](../SPEC.md) §4.1, §5, §7, §9 Phase 2  
**Branch:** `phase-2/auth`

**PR title:** `feat: Firebase Auth with landing login/signup and route guards`

**Goal:** Ship Firebase Auth (email + Google sign-in, sign out) with route guards on tab routes and `/holdings`. Bootstrap `users/{uid}` in Firestore on first sign-in. Phase 1 shell stays intact.

---

## Locked decisions

| Topic | Choice |
|-------|--------|
| Google | `signInWithRedirect` + `getRedirectResult` |
| Bootstrap | `onAuthStateChanged` only, idempotent `setDoc` merge |
| Redirect | `isNewUser` → `/holdings`; else → `/folio` |
| Firestore rules | `users/{uid}` owner-only |
| Auth code | One file: `src/lib/auth.ts` |
| Landing UI | One client `page.tsx`, `useState` Sign In / Sign Up toggle |
| Guards | `AuthProvider` + `RequireAuth` — no middleware |

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/auth.ts` | NEW — `bootstrapUserDoc`, `resolvePostAuthPath`, `AUTH_ERRORS` |
| `src/components/auth/AuthProvider.tsx` | NEW |
| `src/components/auth/RequireAuth.tsx` | NEW |
| `src/app/layout.tsx` | Wrap children in `<AuthProvider>` |
| `src/app/page.tsx` | Auth UI; remove "Preview app shell" link |
| `src/app/(tabs)/layout.tsx` | Wrap in `<RequireAuth>` |
| `src/app/holdings/page.tsx` | NEW — protected stub |
| `src/app/(tabs)/user/page.tsx` | Email, provider, sign out |
| `firestore.rules` | `users/{uid}` owner read/write; deny all else |

**Untouched:** `src/lib/firebase/client.ts`, tab stubs, `BottomNav`, `AppShell`.

---

## Pre-flight (manual)

- Firebase Console: Email/Password + Google enabled
- Authorized domains: `localhost`, `zenstocks2.vercel.app`, Vercel preview hostname

---

## Verification checklist

- [ ] `npm run lint && npm run typecheck && npm run build`
- [ ] Email sign-up → `/holdings`
- [ ] Email sign-in → `/folio`
- [ ] Google sign-in works on preview
- [ ] Sign out from `/user` → `/`
- [ ] Unauthenticated `/folio` → `/`
- [ ] `users/{uid}` doc appears in Firestore console
- [ ] `firebase deploy --only firestore:rules` after merge
- [ ] No bottom nav on `/` or `/holdings`

---

## Deferred to Phase 3

- `getCountFromServer` / empty-portfolio redirect
- `users/{uid}/holdings/*` rules
- Holdings CRUD form on `/holdings`
- shadcn tabs, confirm-password, theme toggle, account deletion
