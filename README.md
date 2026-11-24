# Boluck

Smart-contract bounty escrow and contributor payments on Stellar (Testnet MVP).

Issuers post a bounty and lock the USDC reward in escrow before work starts; contributors verify the funding, accept,
submit their work and get paid the moment it's approved. Cancellations and refunds follow clear, contract-enforced
rules.

> **Current state:** connected to the Boluck API and real Stellar wallets on **Testnet**. The reward is locked in
> escrow on Stellar (claimable balances run by the backend — there is no Soroban contract). API contract:
> [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md). Set `NEXT_PUBLIC_DEMO_MODE=1` for the in-browser
> simulation on seed data.

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
pnpm test          # escrow-rule tests
pnpm format        # prettier (tabs, width 130)

pnpm --filter web dev      # one app
```

## Try the flow (live, Testnet)

1. Install Freighter (or xBull, Albedo, LOBSTR, Rabet, Hana) and switch it to **Testnet**. Create two accounts: an
   issuer and a contributor.
2. Fund both with XLM at [Friendbot](https://lab.stellar.org/account/fund), add the USDC trustline, and get test
   USDC for the issuer from [Circle's faucet](https://faucet.circle.com).
3. Open http://localhost:3000, connect as the issuer and sign the sign-in request (it moves no funds).
4. **Create a bounty** (saved as a draft) → **Publish and fund** (your wallet signs publish, fund and, if you named
   one, assign).
5. Switch your wallet to the contributor account, connect again → **Accept** → **Submit work**.
6. Back as the issuer → **Review** → **Approve and release** (two signatures). Try **Refunds & safety** for the
   request → confirm cancellation flow.

For a walkthrough without wallets, run `NEXT_PUBLIC_DEMO_MODE=1 pnpm dev`: the Issuer / Contributor toggle swaps two
seeded demo wallets, and **Settings → Simulate failed transactions** shows the error states.

## Deployment

One Vercel project with Services (`vercel.json`): `apps/landing` at `/`, `apps/web` under `/app`. See `CLAUDE.md`.
