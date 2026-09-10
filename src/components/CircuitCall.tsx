import type { CSSProperties } from 'react';
import { useState } from 'react';

type CallStatus = 'idle' | 'proving' | 'submitting' | 'success' | 'error';

interface CircuitCallProps {
  /** Public argument to the `increment` circuit — safe to show in the UI. */
  amount: number;
  /**
   * Injected caller that performs the real proof + submission using the
   * Midnight.js providers (proof generated locally in-browser via the
   * proof server / dapp-connector-proof-provider, then submitted through
   * the indexer). Wiring this up requires your deployed contract address
   * and configured providers — see useMidnight.ts and the Midnight.js docs.
   *
   * CRITICAL: this function must never accept or return the private
   * witness value (the secret key). The witness is supplied to the
   * Contract's witnesses object at construction time, entirely outside
   * of any UI state — see contracts/counter.compact and tests/counter.test.ts.
   */
  callIncrement: (amount: number) => Promise<{ txHash: string; newCount: bigint }>;
}

export function CircuitCall({ amount, callIncrement }: CircuitCallProps) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [result, setResult] = useState<{ txHash: string; newCount: bigint } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setErrorMessage(null);
    setResult(null);
    try {
      setStatus('proving');
      // NOTE: proof generation happens inside callIncrement, in-browser,
      // using the local proof server. No private data leaves this device.
      setStatus('submitting');
      const res = await callIncrement(amount);
      setResult(res);
      setStatus('success');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  return (
    <div style={styles.container}>
      <p style={styles.privacyLabel}>🔒 Proved without revealing your input</p>

      <button
        style={styles.button}
        onClick={handleClick}
        disabled={status === 'proving' || status === 'submitting'}
      >
        {status === 'proving' && 'Generating proof…'}
        {status === 'submitting' && 'Submitting to Preprod…'}
        {(status === 'idle' || status === 'success' || status === 'error') &&
          `Increment counter by ${amount}`}
      </button>

      {(status === 'proving' || status === 'submitting') && (
        <div role="status" style={styles.loadingRow}>
          <span style={styles.spinner} aria-hidden="true" />
          <span>{status === 'proving' ? 'Generating zero-knowledge proof locally…' : 'Waiting for on-chain confirmation…'}</span>
        </div>
      )}

      {status === 'success' && result && (
        <div style={styles.resultBox}>
          <p style={{ margin: 0 }}>✅ Submitted on-chain.</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem' }}>
            tx: {result.txHash}
          </p>
          <p style={{ margin: 0 }}>New public count: {result.newCount.toString()}</p>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <p role="alert" style={styles.error}>⚠️ {errorMessage}</p>
      )}

      {/*
        Deliberately no UI element anywhere in this component reads,
        stores, or displays the private witness. Only `amount` (a public
        circuit argument) and the post-submission tx/result are shown.
      */}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    padding: '1rem', borderRadius: '0.75rem', border: '1px solid #2a2a2a',
    maxWidth: '420px', width: '100%',
  },
  privacyLabel: { margin: 0, fontSize: '0.8rem', color: '#8a8a8a' },
  button: {
    padding: '0.7rem 1rem', borderRadius: '0.5rem', border: 'none',
    background: '#5b3df5', color: 'white', cursor: 'pointer', fontWeight: 600,
  },
  loadingRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' },
  spinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid #444', borderTopColor: '#5b3df5',
    animation: 'spin 0.8s linear infinite',
  },
  resultBox: {
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(46, 204, 113, 0.1)',
  },
  error: { color: '#e74c3c', fontSize: '0.85rem', margin: 0 },
};
