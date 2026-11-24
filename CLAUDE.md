# Boluck

Bounty escrow and contributor payments on Stellar. MVP, **Testnet only**: issuer creates a bounty →
locks the USDC reward in escrow → contributor accepts → submits work → issuer approves → reward is released; plus
cancellation and refunds under the PRD's rules. PRD:
https://docs.google.com/document/d/1poXBWpvA4guD4Vq14H1Y5iXEwbQGXPx1K9EBn3cjNkg. Design: Figma "BOLUCK MVP"
(see `docs/DESIGN-PLAN.md`). **Scope, status and decisions: `docs/PLAN.md`. Test scenarios: `docs/TESTING.md`.
API contract: `docs/FRONTEND_INTEGRATION.md`.**
Structure mirrors the Stackly reference repo (github.com/stellardev002/stackly).

**Current state: connected to the Boluck API** (`NEXT_PUBLIC_API_URL`, default the Railway deployment, includes
`/api/v1`) and real Stellar wallets on Testnet. Escrow is Stellar claimable balances run by the backend: there is
**no Soroban contract**, so never show a contract address or say a smart contract holds funds ("locked in escrow on
Stellar"). `NEXT_PUBLIC_DEMO_MODE=1` switches back to the in-browser simulation on seed data.

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
  `settings`, `wallet/components/*` + `wallets.ts` + `kit.ts` (real wallets, sign only), `escrow/store.ts` (state;
  demo actions), `escrow/live.ts` (live actions over the API) and `escrow/hooks.ts` (selectors).
- `components/` app chrome (`layouts/*`, `providers/StoreHydrator`, `PageHeader`). `lib/` site config, routes,
  `api/` — `config.ts` (live/demo, API URL), `client.ts`, `types.ts`, `mappers.ts` (API → domain model),
  `mock-data.ts` (demo seed data).

## Rules

- **The backend owns state.** Show action buttons from the bounty's `availableActions`, never set a status
  optimistically, and refetch the bounty after every action. The guards in `@repo/stellar/escrow` (unit-tested) are
  client-side pre-checks in live mode and the rules of the demo.
- Every on-chain write goes through `runLive()` (`escrow/live.ts`): prepare on the API → the wallet **signs only**
  (never submit to Stellar yourself, never change the XDR) → `POST /actions/{id}/submit` → poll while `pending` →
  only `confirmed` is success. The demo's `run()` mirrors it (Confirm / Reject → pending → toast). Never add a write
  that skips them. Off-chain draft saves (create / edit / delete) call the API directly.
- Amounts from the API are decimal strings; send the reward exactly as typed (`rewardText`), never a float.
- Show the API's error `message` as is; branch on `error.code`.
- The wallet token lives in `sessionStorage` (never `localStorage`).
- Components use design tokens (`bg-surface`, `text-ink`, `bg-primary`…), never hex values.
- Never request, store, log or render a secret key. The `__BOLUCK_TEST_WALLET__` hook (`wallet/kit.ts`) exists only
  in development builds for browser tests; the key stays in the test process.
