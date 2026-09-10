import { useCallback, useState } from 'react';

// Types are approximate to the @midnight-ntwrk/dapp-connector-api shape.
// Verify exact method/field names against the live docs MCP or
// https://docs.midnight.network before shipping — connector APIs change
// between SDK versions.
interface DAppConnectorAPI {
  enable(): Promise<DAppConnectorWalletAPI>;
  isEnabled(): Promise<boolean>;
}

interface DAppConnectorWalletAPI {
  state(): Promise<{ address: string }>;
}

declare global {
  interface Window {
    midnight?: {
      mnLace?: DAppConnectorAPI;
    };
  }
}

export type WalletError =
  | { type: 'not-installed'; message: string }
  | { type: 'rejected'; message: string }
  | { type: 'network-mismatch'; message: string }
  | { type: 'unknown'; message: string };

interface UseMidnightState {
  address: string | null;
  connecting: boolean;
  error: WalletError | null;
}

export function useMidnight() {
  const [state, setState] = useState<UseMidnightState>({
    address: null,
    connecting: false,
    error: null,
  });

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));

    const connector = window.midnight?.mnLace;
    if (!connector) {
      setState({
        address: null,
        connecting: false,
        error: {
          type: 'not-installed',
          message: 'Lace wallet extension was not found. Install it from lace.io.',
        },
      });
      return;
    }

    try {
      const walletApi = await connector.enable();
      const { address } = await walletApi.state();
      setState({ address, connecting: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isRejection = /reject|denied|cancel/i.test(message);
      const isNetworkIssue = /network/i.test(message);

      setState({
        address: null,
        connecting: false,
        error: isRejection
          ? { type: 'rejected', message: 'Connection request was rejected in the wallet.' }
          : isNetworkIssue
            ? { type: 'network-mismatch', message: 'Wallet network does not match this dApp (expected Preprod).' }
            : { type: 'unknown', message },
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, connecting: false, error: null });
  }, []);

  return { ...state, connect, disconnect };
}
