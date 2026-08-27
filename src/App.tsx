import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Layers, 
  Activity, 
  FileCode, 
  GitBranch, 
  BookOpen, 
  Terminal, 
  ShieldCheck, 
  ExternalLink,
  Droplet,
  CheckCircle2,
  Heart,
  ChevronRight,
  Globe
} from 'lucide-react';
import { WalletAccount, TransactionRecord, SorobanEvent } from './types';
import { CONTRACT_ADDRESSES } from './data/contracts';
import { Navbar } from './components/Navbar';
import { VaultDashboard } from './components/VaultDashboard';
import { ContractExplorer } from './components/ContractExplorer';
import { EventStreamer } from './components/EventStreamer';
import { TestRunner } from './components/TestRunner';
import { CiCdPipeline } from './components/CiCdPipeline';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { TransactionModal } from './components/TransactionModal';
import { Toast, ToastMessage } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Wallet state
  const [wallet, setWallet] = useState<WalletAccount>({
    address: 'GDUK52WJ5P2Q56G6W77V54Z3KMNP36LQH364E3L5MN5K6STLR7YTBXLM',
    name: 'Stellar Freighter Wallet',
    publicKey: 'GDUK52WJ5P2Q56G6W77V54Z3KMNP36LQH364E3L5MN5K6STLR7YTBXLM',
    secretKeyMasked: 'SDAK...TESTNET',
    xlmBalance: 345.8,
    usdcBalance: 120.0,
    strlBalance: 125.4,
    connected: true,
    network: 'testnet'
  });

  const [isFauceting, setIsFauceting] = useState<boolean>(false);
  const [inspectedTx, setInspectedTx] = useState<TransactionRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Real-time events list
  const [events, setEvents] = useState<SorobanEvent[]>([
    {
      id: 'evt-init-1',
      contractId: CONTRACT_ADDRESSES.VAULT,
      contractName: 'StellarVaultContract',
      topic: ['deposit', 'GDUK...XLM'],
      data: { depositor: 'GDUK...XLM', deposited_xlm: 100, shares_minted: 98.5, oracle_price: 0.1048 },
      ledger: 5129402,
      timestamp: '11:42:15 AM',
      txHash: '7c8f9b4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a',
      type: 'deposit'
    },
    {
      id: 'evt-init-2',
      contractId: CONTRACT_ADDRESSES.VAULT,
      contractName: 'StellarVaultContract',
      topic: ['swap', 'XLM_TO_USDC'],
      data: { user: 'GB7X...TEST', amount_in: 50, amount_out: 24.85, fee: 30 },
      ledger: 5129408,
      timestamp: '11:45:30 AM',
      txHash: '9a3d1e8c4b2f8a4c6e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a',
      type: 'swap'
    },
    {
      id: 'evt-init-3',
      contractId: CONTRACT_ADDRESSES.YIELD,
      contractName: 'YieldDistributor',
      topic: ['yield', 'harvest_reward'],
      data: { keeper: 'GD9X...KEEPER', yield_claimed: 25.0, status: 'AUTO_COMPOUNDED' },
      ledger: 5129415,
      timestamp: '11:48:02 AM',
      txHash: '3e6f2b8a4c6e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d9b3a7c4e1d',
      type: 'yield_claim'
    }
  ]);

  // Transaction records
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRecordTransaction = (tx: TransactionRecord) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const handleEmitEvent = (event: SorobanEvent) => {
    setEvents((prev) => [event, ...prev]);
  };

  // Friendbot Faucet Trigger
  const handleFaucet = async () => {
    setIsFauceting(true);
    showToast('Requesting 100 Testnet XLM from Stellar Friendbot...', 'info');

    try {
      await new Promise((r) => setTimeout(r, 1200));
      setWallet((w) => ({ ...w, xlmBalance: w.xlmBalance + 100.0 }));
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });

      showToast('Friendbot funded your account with +100.00 Testnet XLM!', 'success');
    } catch {
      showToast('Friendbot rate limited, please try again shortly.', 'error');
    } finally {
      setIsFauceting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wallet={wallet}
        setWallet={setWallet}
        onFaucet={handleFaucet}
        isFauceting={isFauceting}
        eventCount={events.length}
        onOpenTestModal={() => setActiveTab('tests')}
        onShowToast={showToast}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <VaultDashboard
            wallet={wallet}
            setWallet={setWallet}
            onShowToast={showToast}
            onRecordTransaction={handleRecordTransaction}
            onEmitEvent={handleEmitEvent}
            onNavigateToTab={setActiveTab}
            onInspectTx={setInspectedTx}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractExplorer
            wallet={wallet}
            onRecordTransaction={handleRecordTransaction}
            onEmitEvent={handleEmitEvent}
            onShowToast={showToast}
            onInspectTx={setInspectedTx}
          />
        )}

        {activeTab === 'events' && (
          <EventStreamer
            events={events}
            onClearEvents={() => setEvents([])}
            onEmitEvent={handleEmitEvent}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'tests' && (
          <TestRunner
            onShowToast={showToast}
          />
        )}

        {activeTab === 'cicd' && (
          <CiCdPipeline
            onShowToast={showToast}
          />
        )}

        {activeTab === 'docs' && (
          <ArchitectureDocs
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Global Transaction Modal */}
      <TransactionModal
        tx={inspectedTx}
        onClose={() => setInspectedTx(null)}
        onShowToast={showToast}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-8 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              ★
            </div>
            <span className="font-semibold text-slate-200">Starlight Protocol</span>
            <span className="text-slate-500">• Production Stellar Soroban Smart Contract Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <a 
              href="https://soroban.stellar.org/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>Soroban Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a 
              href="https://stellar.expert/explorer/testnet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <span>Stellar Expert Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
