# ADR 0001: shadcn base-nova and Serwist Turbopack integration

**Status:** Accepted  
**Date:** 2026-07-02  
**Spec reference:** Phase 1 locked decisions (shadcn style, Serwist)

## Context

Phase 1 plan locked **shadcn New York + Zinc** and **Serwist** via `@serwist/next`. The scaffold landed on **Next.js 16** with Turbopack as the default bundler and **shadcn v4**, whose default preset is **base-nova** (not the legacy New York style name).

## Decision

1. **shadcn:** Use `base-nova` style with `baseColor: zinc`. shadcn v4 treats base-nova as the current default component set; zinc tokens match the locked palette intent.
2. **Serwist:** Use `@serwist/turbopack` instead of `@serwist/next`. Next.js 16 defaults to Turbopack; the Turbopack integration is the supported Serwist path per [Serwist docs](https://serwist.pages.dev/docs/next/turbo). `@serwist/turbopack` is a **runtime** dependency (used by `SerwistProvider` in `layout.tsx`); `serwist` and `esbuild` remain dev-only for SW compilation.

## Consequences

- Visual density may differ slightly from legacy New York; zinc theming is preserved.
- Phase 1 plan text still references `@serwist/next` and New York — this ADR supersedes those literals for the implemented stack.
- No change to SPEC §2 intent (Serwist PWA, shadcn/ui, Tailwind).
