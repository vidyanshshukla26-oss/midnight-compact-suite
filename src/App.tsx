import { useState } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';

// Fill in with your real Preprod contract address once deployed.
export const CONTRACT_ADDRESS = 'REPLACE_WITH_YOUR_PREPROD_CONTRACT_ADDRESS';

// Placeholder for wiring to real Midnight.js providers. Replace this with
// a call through @midnight-ntwrk/midnight-js-contracts using the deployed
// contract at CONTRACT_ADDRESS. See:
// https://docs.midnight.network (Midnight.js provider setup)
async function callIncrementOnChain(amount: number) {
  throw new Error(
    'callIncrementOnChain is not wired up yet. Configure Midnight.js providers ' +
      `for contract ${CONTRACT_ADDRESS} and replace this stub.`
  );
  // Example shape of what a real implementation returns:
  // return { txHash: '0x...', newCount: 5n };
  // (unreachable, satisfies the return type for now)
  // eslint-disable-next-line no-unreachable
  return amount as unknown as { txHash: string; newCount: bigint };
}

export default function App() {
  const [amount] = useState(1);

  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '1.5rem', padding: '2rem 1rem', minHeight: '100vh',
      background: '#111', color: '#eee', fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ fontSize: '1.5rem', textAlign: 'center' }}>Midnight Counter dApp</h1>
      <p style={{ maxWidth: 480, textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }}>
        Connect your Lace wallet, then increment the on-chain counter. The proof
        that you're authorized to increment it is generated entirely in your
        browser — your private key never leaves this device.
      </p>
      <WalletConnect />
      <CircuitCall amount={amount} callIncrement={callIncrementOnChain} />
    </main>
  );
}
