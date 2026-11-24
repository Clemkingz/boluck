# Testing

## Automated

- `pnpm test` — `packages/stellar/src/escrow.test.ts`: the escrow rules behind the PRD's test scenarios
  (authorization, funding, duplicate payout, insufficient escrow, every cancellation path). In live mode the API
  enforces them; the same guards run as client-side pre-checks.
- `pnpm check-types` and `pnpm lint` across all workspaces.

## PRD scenarios (§7), live on Testnet

Setup: two Testnet wallets (issuer, contributor), both funded with Friendbot XLM and a USDC trustline; test USDC for
the issuer from Circle's faucet. See `docs/FRONTEND_INTEGRATION.md` §10.

| #     | Scenario                                | How to try it                                                                        |
| ----- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| 1–3   | Create, fund, assign                    | Create (draft) → Publish and fund: the wallet signs publish, fund and assign         |
| 4–5   | Accept, submit                          | As the contributor: Accept Assignment → Submit completed work                        |
| 6–7   | Approve, release                        | As the issuer: Review → Approve and release (two signatures) → Paid                  |
| 8     | Unauthorized approval                   | The contributor is never offered approve (`availableActions`); the API rejects it    |
| 9     | Insufficient funding                    | Fund more than the wallet holds: blocked before signing (`INSUFFICIENT_BALANCE`)     |
| 10    | Repeated payout                         | A paid bounty offers no release; the API returns `ALREADY_PAID`                      |
| 11–12 | Cancel unfunded / funded-unassigned     | Refunds & safety → Cancel (and refund)                                               |
| 13    | Cancel assigned without the other party | Only "Request cancellation" is offered; nothing moves until the other party confirms |
| 14    | Refund a paid bounty                    | Paid bounties offer no cancellation action                                           |
| 15    | Failed token transfer                   | A failed action shows the API's message; the refetched bounty is unchanged           |
| 16    | Invalid reward                          | The create form and the API reject 0, negatives and more than 2 decimals             |
| 17    | Unauthorized payout-recipient change    | Terms lock when the draft is published (`BOUNTY_LOCKED`); only the issuer can assign |
| 18    | History matches on-chain records        | Payment history and activity link every step to stellar.expert                       |

Also: rejecting a signature in the wallet changes nothing and shows a warning toast; a wallet on the wrong network
is stopped before signing; switching accounts in the wallet ends the session.

Demo mode (`NEXT_PUBLIC_DEMO_MODE=1`) runs the same journey in the browser with the seeded wallets; Settings →
Simulate failed transactions covers #15 there.

## Last run (end-to-end, headless Chromium)

**Live** (Railway API, Stellar Testnet, two throwaway wallets): sign-in for both sides; draft create → edit →
delete; publish + fund + assign (3 signatures); accept; submit; issuer review warning; request revision;
revision countdown; resubmit; approve + release (2 signatures) → paid; history with explorer links; contributor
notifications; cancellation request → contributor confirms → refunded, shown in refund history; session restored
after reload; non-party bounty shows not-found — 22/22 passing.

**Demo**: landing → xBull hand-off → overview; create → fund → assign → accept → submit → approve & release;
wallet reject; refund; agreement gate; history; failure simulation; 404 — 14/14 passing.
