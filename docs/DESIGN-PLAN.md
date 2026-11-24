# Design

Figma file **BOLUCK MVP** (pages "Design System" and "Workspace").

## Tokens (`packages/ui/src/styles/globals.css`)

| Token                             | Value                       | Use                              |
| --------------------------------- | --------------------------- | -------------------------------- |
| `canvas`                          | #0d1b2a                     | Primary canvas (page background) |
| `surface`                         | #142538                     | Cards, sidebar                   |
| `elevated`                        | #1b2f43                     | Active nav, chips                |
| `deep`                            | #1b4332                     | Icon tiles                       |
| `primary`                         | #2dd4a8                     | Primary buttons, links           |
| `highlight`                       | #73ffb8                     | Success                          |
| `ink` / `muted`                   | #e7efea / #a7b5ba           | Primary / secondary text         |
| `line`                            | #29404f                     | Borders                          |
| `review` / `active` / `attention` | #e6c46a / #65c4c9 / #e98c78 | Status tones                     |

Fonts: Space Grotesk 700 (headings), DM Sans (body, the "boluck." wordmark in 800).

## Screens → code

| Figma frame                                  | Route                                                   | Component                                    |
| -------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| Welcome / Landing page                       | `apps/landing` `/`                                      | `features/landing/components/*`              |
| Connect Wallet 1–4                           | `apps/web` `/connect` (+ landing hand-off)              | `features/wallet/components/WalletFlowModal` |
| Issuer / Contributor Overview                | `/overview`                                             | `features/overview/Overview`                 |
| Explore Bounties                             | `/bounties`                                             | `ExploreBounties`                            |
| Create a bounty                              | `/bounties/new`                                         | `CreateBounty`                               |
| Bounty summary 1–2, Funding confirmation 1–2 | `/bounties/[id]/fund` → `/bounties/[id]?confirmed=fund` | `FundBounty`, `TxDialog`, `BountyDetail`     |
| Bounty details 1–5                           | `/bounties/[id]`                                        | `BountyDetail`                               |
| Submit work 1–2                              | `/bounties/[id]/submit`, `/bounties/[id]/review`        | `SubmitWork`, `ReviewSubmission`             |
| Payment history 1–4                          | `/history`                                              | `features/history/TransactionHistory`        |
| Refund & safety 1–4                          | `/refunds`                                              | `features/refunds/Refunds`                   |

Added beyond the frames: loading screens (`EscrowLoader`), 404 / error / global-error pages, toasts, wallet
confirmation progress, demo settings, motion (fade-up, stagger, scroll reveal via `@repo/ui/reveal`, count-up,
stepper / progress grow-in, pulse rings, live-status dot pulse, hover lift, button shine, animated hero gradient,
ambient glows). Responsive from 320 px to 2560 px: named `3xl` (1800 px) / `4xl` (2400 px) breakpoints widen layouts
and scale type on large monitors.
