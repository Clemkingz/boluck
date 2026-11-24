# Boluck MVP: plan

Source: the PRD (linked from CLAUDE.md). Design: Figma, see [DESIGN-PLAN.md](DESIGN-PLAN.md).

**Definition of done (PRD §12):** an issuer can create a bounty, define the reward and completion conditions, and
fund it with testnet USDC. An assigned contributor can view the funded bounty, accept, submit work and track the
reward. The escrow enforces authorized approval and payout, prevents duplicate payments, and supports cancellation
and refunds under predefined conditions. Both sides see accurate statuses, funding records and history.

## Status

The app is connected to the Boluck API (Railway) and real Stellar wallets on Testnet. The API contract is
[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md). The in-browser simulation is still available with
`NEXT_PUBLIC_DEMO_MODE=1`.

| Area                                       | State                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| Wallet connection + sign-in                | Live: Stellar Wallets Kit modules, SEP-10 challenge → 12 h token, restore, logout |
| Wrong network                              | Live: compared with the API's passphrase before signing                           |
| Issuer / contributor overview              | Live: GET /dashboard totals; role toggle = filter                                 |
| Create bounty + draft edit / delete        | Live (off-chain draft, no signature)                                              |
| Publish + fund (+ assign)                  | Live: `create`, `fund`, `assign` — one signature each                             |
| Bounty details, accept, submit, revision   | Live, buttons from `availableActions`                                             |
| Approve + release                          | Live: two signatures; auto-release countdown; "Claim payment" fallback            |
| Cancellation & refund                      | Live: cancel / request → confirm or withdraw / reclaim; refund history            |
| History, notifications                     | Live, paginated, explorer links; notifications polled every 30 s                  |
| Loading, empty, error, 404, toasts, motion | Done                                                                              |
| Escrow                                     | Stellar claimable balances, run by the backend (no Soroban contract)              |

## Decisions

- **No Soroban contract.** Escrow is a Stellar claimable balance managed by the backend; every step is a Stellar
  transaction with a stellar.expert link. This replaces the PRD's Soroban contract; the client approved the change
  (2026-11-24).
- **Asset:** always testnet USDC (`GET /escrow/config` → `asset`). XLM is shown for fees only.
- **Lifecycle:** Draft (off-chain, editable) → Draft (published) → Funded → Assigned → In progress → Submitted
  (→ Revision requested) → Approved → Paid; Cancelled / Refunded.
- **Approve and release** are two signatures. If the issuer approves and never releases, the server releases after
  24 h. Approval has no comment (the API takes no note).
- **No open bounties / marketplace** (PRD exclusion): contributors are named by the issuer; the API returns 404 to
  anyone who isn't a party. The former Explore page is now "Your bounties".
- **Cancellation:** unfunded → issuer cancels; funded & unassigned → issuer cancels with refund; assigned → one party
  requests (`cancelRequestedBy`), the other confirms, or the requester withdraws; after `reclaimAfterAt` the issuer
  can reclaim; paid → never.
- **Identity:** wallet addresses, no names; no project name or per-bounty icon (not in the API).
- **Session:** the wallet token is kept in `sessionStorage` (guide §4), so a new tab means signing in again.
- **Demo mode** keeps the seeded two-wallet simulation (Sam Andrew / Ada Okafor) for walkthroughs without wallets.

## Open items

- Allow the production web origin in the backend's `FRONTEND_URL` / `CORS_ORIGINS` (in progress, 2026-11-24). Check
  with a preflight request once deployed.
- Guide vs. backend note on `auto_release`: the guide (§7) shows it to the contributor as a "Claim payment"
  fallback; the app does that only when the server lists it in `availableActions`.
