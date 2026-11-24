# Boluck MVP: plan

Source: the PRD (linked from CLAUDE.md). Design: Figma, see [DESIGN-PLAN.md](DESIGN-PLAN.md).

**Definition of done (PRD §12):** an issuer can create a bounty, define the reward and completion conditions, and
fund it with testnet USDC. An assigned contributor can view the funded bounty, accept, submit work and track the
reward. The contract enforces authorized approval and payout, prevents duplicate payments, and supports
cancellation and refunds under predefined conditions. Both sides see accurate statuses, funding records and history.

## Status

| Area                                        | State                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| Landing + wallet chooser (Screen 1)         | Done, mock wallets (Freighter = setup walkthrough, xBull / Albedo = ready)   |
| Issuer / contributor overview               | Done                                                                         |
| Create bounty                               | Done (validation, optional pre-assigned contributor)                         |
| Fund bounty + wallet confirmation           | Done (simulated signature, ledger confirmation)                              |
| Bounty details & assignment                 | Done (role-aware next step, assign / claim / accept)                         |
| Work submission & review                    | Done (approve-and-release, request revision)                                 |
| Payout & payment history                    | Done (filters, CSV export, demo references)                                  |
| Cancellation & refund                       | Done (PRD cancellation rules, contributor agreement)                         |
| Loading, empty, error, 404, toasts, motion  | Done                                                                         |
| Escrow smart contract                       | Not started (separate deliverable)                                           |
| Backend (metadata, indexing, notifications) | Not started — `apps/web/src/lib/api/mock-data.ts` stands in                  |
| Real wallet connection                      | Not started — replace the mock in `features/wallet` with Stellar Wallets Kit |

## Decisions

- **Lifecycle:** Draft → Funded → Assigned → In progress → Submitted (→ Revision requested) → Approved → Paid;
  Cancelled / Refunded. The stepper shows the design's six steps (Approved is folded into Submitted → Paid).
- **Approve and release** is one action in the review screen (design), recorded as two events (approve + payout).
  An `approved` bounty whose release failed can be released from its details page.
- **Open bounties:** a funded bounty without a contributor can be claimed by any other wallet (create form:
  "Leave blank to make this bounty open").
- **Cancellation:** unfunded → cancel freely; funded & unassigned → full refund; assigned → contributor agreement
  (a checkbox in the demo, a contributor signature on chain); approved / paid → never.
- **Demo wallets:** the Issuer / Contributor switch swaps between two seeded wallets (Sam Andrew, Ada Okafor) so both
  sides of a bounty can be walked through in one browser.
