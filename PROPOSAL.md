# Product Proposal

## What is the product, and who uses it?
This project is a privacy-preserving counter dApp. An owner can authorize increments with a secret key, while anyone can inspect the public counter value. It demonstrates how an application can verify authorization without publishing the authorization secret.

## Why Midnight specifically?
Midnight supports private witnesses and zero-knowledge proofs, allowing the contract to verify possession of the owner's secret key without putting that key on the public ledger. A transparent chain could expose the key or require a linkable identity for the same workflow.

## Data Model
| Data Point       | Type           | Disclosed To |
|------------------|----------------|--------------|
| Counter value    | Public ledger  | Everyone     |
| Owner commitment | Public ledger  | Everyone     |
| Owner secret key | Private witness| Contract proof only |
| Increment amount | Public input   | Everyone     |

## Mainnet Feasibility
The counter is intentionally small and suitable for a staged deployment. Mainnet readiness still requires contract review, wallet and network configuration, proof-server operations, cost estimates, and end-to-end testing against the target network.
