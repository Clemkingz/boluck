# Boluck

Smart-contract bounty escrow and contributor payments on Stellar (Testnet MVP).

Issuers post a bounty and lock the USDC reward in escrow before work starts; contributors verify the funding, accept,
submit their work and get paid the moment it's approved. Cancellations and refunds follow clear, contract-enforced
rules.

> **Current state:** frontend only, on **mock data** — no backend, no deployed contract, no real wallet. Everything
> is simulated in the browser so the full flow can be tried before the backend is connected.

## Monorepo

Turborepo + pnpm. Requires Node ≥ 22 and pnpm 12.

```
apps/
  landing/   public site (http://localhost:3002)
  web/       the app      (http://localhost:3000)
packages/
  ui/                 @repo/ui — design tokens, components, brand, toasts
  stellar/            @repo/stellar — bounty model, escrow rules (+ tests), network, assets, formatting
  eslint-config/      @repo/eslint-config
  typescript-config/  @repo/typescript-config
docs/                 PLAN.md · TESTING.md · DESIGN-PLAN.md
```

## Commands

```bash
pnpm install
pnpm dev           # both apps
pnpm build
pnpm check-types
pnpm lint
pnpm test          # escrow contract-rule tests
pnpm format        # prettier (tabs, width 130)

pnpm --filter web dev      # one app
```

## Try the flow

1. Open http://localhost:3002, pick **Issuer**, choose **xBull** (ready) — or **Freighter** to walk through the
   simulated install/setup — and approve the connection.
2. **Create a bounty** → **Fund** it → confirm in the wallet dialog.
3. Switch the Overview toggle to **Contributor** (swaps to the demo contributor wallet) → **Accept** → **Submit work**.
4. Switch back to **Issuer** → **Review** → **Approve and release**.
5. Try **Refunds & safety**, and **Demo settings → Simulate failed transactions** for error states.

## Deployment

One Vercel project with Services (`vercel.json`): `apps/landing` at `/`, `apps/web` under `/app`. See `CLAUDE.md`.
