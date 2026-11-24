# Testing

## Automated

- `pnpm test` — `packages/stellar/src/escrow.test.ts`: the contract rules behind the PRD's test scenarios
  (authorization, funding, duplicate payout, insufficient escrow, every cancellation path).
- `pnpm check-types` and `pnpm lint` across all workspaces.

## PRD scenarios (§7) in the demo

| #     | Scenario                            | How to try it                                                                         |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| 1–2   | Create and fund a bounty            | Create a bounty → Fund → confirm in the wallet dialog                                 |
| 3–4   | Assign, accept                      | Details → Assign (demo: Ada's wallet) → switch to Contributor → Accept Assignment     |
| 5–7   | Submit, approve, release            | Submit work → switch to Issuer → Review → Approve and release                         |
| 8     | Unauthorized approval               | Open a bounty as the contributor: review actions are not offered; the guard rejects   |
| 9     | Insufficient funding                | Fund a reward larger than the wallet balance: the button is disabled with the reason  |
| 10    | Repeated payout                     | A paid bounty shows "Reward released"; the guard rejects a second release (unit test) |
| 11–12 | Cancel unfunded / funded-unassigned | Refunds & safety → choose the bounty → Confirm                                        |
| 13    | Cancel assigned without agreement   | Refunds & safety: disabled until "Contributor agrees to cancel" is ticked             |
| 14    | Refund a paid bounty                | Refunds & safety on a paid bounty: rule "Paid bounties cannot be refunded" applies    |
| 15    | Failed token transfer               | Settings → Simulate failed transactions: status and balances stay unchanged           |
| 16    | Invalid reward                      | Create form rejects 0 / negative amounts                                              |
| 18    | History matches events              | Payment history lists every escrow, payout and refund with references                 |

Also: rejecting a request in the wallet dialog changes nothing and shows a warning toast.

## Last run (end-to-end, headless Chromium)

Landing → xBull hand-off → overview; create → fund → assign → accept → submit → approve & release; wallet reject;
refund; agreement gate; history; failure simulation; 404 — all passing. No horizontal overflow at 375 px or 820 px.
