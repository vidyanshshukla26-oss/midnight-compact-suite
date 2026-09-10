# Midnight Counter dApp
![CI](https://github.com/REPLACE_WITH_YOUR_GH_USERNAME/REPLACE_WITH_YOUR_REPO/actions/workflows/ci.yml/badge.svg)

> An ownership-gated counter on Midnight: anyone can see the count go up, but only the holder of a secret key can prove the right to increment it — without ever revealing that key.

## Live Demo
[PASTE LIVE URL AFTER DEPLOYING FRONTEND]

## Contract Address
| Network  | Address                          |
|----------|-----------------------------------|
| Preview  | [PASTE ADDRESS AFTER DEPLOY]     |
| Preprod  | REPLACE_WITH_YOUR_PREPROD_CONTRACT_ADDRESS |

## What This Does
The contract keeps a single public counter (`count`) that only one "owner" can increment. Instead of storing the owner's key on-chain (which would make them identifiable/linkable on every call), the contract stores a **hash commitment** of that key (`owner_commitment`). To increment the counter, a caller must supply the matching secret key as a private witness; the circuit checks the hash inside the proof and only the pass/fail result (plus the increment amount) becomes public.

## Privacy Model
- **PUBLIC** (on-chain, visible to anyone): `count` (the running total), `owner_commitment` (a hash — not the key), and the `amount` argument passed to `increment`.
- **PRIVATE** (private witness, never on-chain): the owner's raw secret key, supplied locally via the `local_secret_key` witness.
- **PROVED without revealing**: that the caller possesses the secret key whose hash equals `owner_commitment` — without disclosing the key itself.

## Privacy Claim
An on-chain observer watching this contract sees: the counter value at every point in time, that some valid proof authorized each increment, and the amount by which it changed. They **cannot** see: who the owner is, what their secret key is, or link separate calls to a real-world identity beyond "whoever holds this one key."

## Tech Stack
Midnight network, Compact language, Midnight.js SDK, React + Vite, Lace wallet, Node.js v22, Docker (proof server)

## Prerequisites
- Node.js v22
- Docker (for the local proof server)
- [Compact toolchain](https://docs.midnight.network/getting-started/installation) (installed via the official installer script, not npm)
- Lace wallet browser extension, funded on Preprod via the faucet

## Setup
```bash
git clone <this-repo-url>
cd midnight-counter-dapp
npm install

# Install the Compact toolchain (one-time, official installer — not an npm package):
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
compact --version

# Start the local proof server (separate terminal, keep running):
docker pull midnightnetwork/proof-server
docker run -p 6300:6300 midnightnetwork/proof-server

# Compile the contract:
compact compile contracts/counter.compact managed/counter

# Run the frontend:
npm run dev
```

## Run Tests
```bash
npm test
```

## CI/CD
`.github/workflows/ci.yml` runs on every push and pull request to `main`. It checks out the repo, installs Node.js v22, runs `npm install`, installs the Compact toolchain and compiles the contract, then runs the test suite. A red badge means the contract failed to compile or a test regressed.

## Product Proposal
See [PROPOSAL.md](./PROPOSAL.md).

## Initial Idea
[LEAVE PLACEHOLDER — fill in manually]

## Screenshots
[LEAVE PLACEHOLDER — add compile output and contract address screenshots]

## Demo Video
[PLACEHOLDER — add the link after recording]
