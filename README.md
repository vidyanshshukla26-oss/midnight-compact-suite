# [**midnight-compact-suite**](https://github.com/vidyanshshukla26-oss/midnight-compact-suite)
![CI](https://github.com/vidyanshshukla26-oss/midnight-compact-suite/actions/workflows/ci.yml/badge.svg)

> Starlight Protocol: a Soroban liquidity vault dashboard.

## Live Demo
[[Live URL]](https://stellar-soroban-dapp-suite.netlify.app)

## Contract Address
| Network | Address |
|----------|---------|
| Preprod | [TBD: replace with deployed contract ID](/) *(placeholder; replace with live contract ID once available).* |

## What This Does
Dashboard for Soroban wallet state, deposits, swaps, yield, contract calls, transactions, and events.

## Privacy Model
- **PUBLIC:** contract calls, events, addresses, balances, and transaction results.
- **PRIVATE:** wallet signing secrets remain in the wallet and are never rendered.
- **PROVED without revealing:** authorization through wallet signatures without exposing secret keys.

## Privacy Claim
Observers can see public Soroban calls and events, but never a wallet secret key.

## Tech Stack
React, TypeScript, Vite, Tailwind CSS, Lucide, Motion, Canvas Confetti, and Soroban.

## Prerequisites
- Node.js 22, npm, Compact CLI, and Freighter wallet.

## Setup & Run Locally
1. Copy `.env.example` to `.env.local`.
2. Run `npm install`.
3. Run `npm run compact` to generate `managed/counter`.
4. Run `npm run dev`.

## Run Tests
```
npm test
```

## CI/CD
Pushes to `main` and pull requests install Node 22, compile Compact, run tests, and build the app.

## Product Proposal
See [PROPOSAL.md](PROPOSAL.md).
