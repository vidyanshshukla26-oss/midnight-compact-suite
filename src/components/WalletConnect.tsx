import type { CSSProperties } from 'react';
import { useMidnight } from '../hooks/useMidnight';

function shorten(address: string): string {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function WalletConnect() {
  const { address, connecting, error, connect, disconnect } = useMidnight();

  if (address) {
    return (
      <div style={styles.container}>
        <div style={styles.statusRow}>
          <span style={styles.dotConnected} aria-hidden="true" />
          <span style={styles.address} title={address}>{shorten(address)}</span>
        </div>
        <button style={styles.buttonSecondary} onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.statusRow}>
        <span style={styles.dotDisconnected} aria-hidden="true" />
        <span>Wallet not connected</span>
      </div>
      <button style={styles.button} onClick={connect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect Lace Wallet'}
      </button>
      {error && (
        <p role="alert" style={styles.error}>
          {error.type === 'not-installed' && '⚠️ '}
          {error.message}
        </p>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid #2a2a2a',
    maxWidth: '420px',
    width: '100%',
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  dotConnected: {
    width: 10, height: 10, borderRadius: '50%', background: '#2ecc71', display: 'inline-block',
  },
  dotDisconnected: {
    width: 10, height: 10, borderRadius: '50%', background: '#888', display: 'inline-block',
  },
  address: { fontFamily: 'monospace' },
  button: {
    padding: '0.6rem 1rem', borderRadius: '0.5rem', border: 'none',
    background: '#5b3df5', color: 'white', cursor: 'pointer', fontWeight: 600,
  },
  buttonSecondary: {
    padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid #444',
    background: 'transparent', color: 'inherit', cursor: 'pointer',
  },
  error: { color: '#e74c3c', fontSize: '0.85rem', margin: 0 },
};
