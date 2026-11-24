# Boluck

Smart-contract bounty escrow and contributor payments on Stellar. MVP, **Testnet only**: issuer creates a bounty →
locks the USDC reward in escrow → contributor accepts → submits work → issuer approves → reward is released; plus
cancellation and refunds under the PRD's rules. PRD:
https://docs.google.com/document/d/1poXBWpvA4guD4Vq14H1Y5iXEwbQGXPx1K9EBn3cjNkg. Design: Figma "BOLUCK MVP"
(see `docs/DESIGN-PLAN.md`). **Scope, status and decisions: `docs/PLAN.md`. Test scenarios: `docs/TESTING.md`.**
Structure mirrors the Stackly reference repo (github.com/stellardev002/stackly).

**Current state: frontend only, on mock data.** No backend, no deployed contract, no real wallet. The whole lifecycle
is simulated in the browser (`apps/web/src/features/escrow/store.ts`) and persisted to `localStorage`.

## Monorepo

Turborepo + pnpm 12 (`packageManager`), Node ≥ 22.

```
apps/landing/       (:3002) public site, PRD Screen 1 (hero + wallet chooser that hands off to the app)
apps/web/           (:3000) the app: /connect, /overview, /bounties/*, /history, /refunds, /settings
packages/ui/        @repo/ui — design tokens (globals.css), components, brand, motion, toasts
packages/stellar/   @repo/stellar — bounty model, escrow rules (+ tests), status metadata, network, assets, formatting
packages/eslint-config, packages/typescript-config
```

`pnpm dev` (both apps) · `pnpm build` · `pnpm check-types` · `pnpm lint` · `pnpm test` · `pnpm format`
(prettier: tabs, width 130).

## Deployment (Vercel Services)

One Vercel project, routed by the root `vercel.json`: `/app` and `/app/*` → `apps/web`, everything else →
`apps/landing`. `apps/web` sets `basePath: "/app"` on every Vercel build (`VERCEL` is set); set `APP_BASE_PATH=""`
once the app has its own domain. Landing links into the app with plain `<a>`s to `APP_URL` and redirects bare app
paths (`/overview`, `/bounties/*`…) to `/app/…`. Turborepo only passes declared env vars to builds (`turbo.json`).

## Stack

Next.js 16 (App Router, Cache Components, React Compiler, Turbopack), React 19, Tailwind v4 (`@tailwindcss/postcss`),
zustand, lucide. Fonts: Space Grotesk (display) + DM Sans (body) via `next/font`.

## App structure (`apps/web/src`)

- `app/` routes. `(dashboard)/` = every wallet-gated screen (layout = `AppShell`: sidebar, top bar, wallet gate,
  `TxDialog`). Dynamic `[id]` pages read params inside `<Suspense>` (Cache Components).
- `features/<feature>/` screens and their logic: `bounties/components/*`, `overview`, `history`, `refunds`,
  `settings`, `wallet/components/*` + `wallets.ts`, `escrow/store.ts` (state + simulated contract calls) and
  `escrow/hooks.ts` (selectors).
- `components/` app chrome (`layouts/*`, `providers/StoreHydrator`, `PageHeader`). `lib/` site config, routes,
  `api/mock-data.ts` (seed data — replace with the backend).

## Rules

- Contract rules live in `@repo/stellar/escrow` and are unit-tested; the UI uses them to gate actions. When the
  escrow contract exists it is the source of truth — keep the guards as client-side pre-checks.
- Every write goes through `run()` in the escrow store: wallet confirmation (Confirm / Reject) → pending → success
  toast, or failure (state unchanged). Never add a write that skips it.
- Components use design tokens (`bg-surface`, `text-ink`, `bg-primary`…), never hex values.
- Never request, store, log or render a secret key.
