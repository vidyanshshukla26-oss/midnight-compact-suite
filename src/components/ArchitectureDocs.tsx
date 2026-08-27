import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Database, 
  GitCommit as GitCommitIcon, 
  ExternalLink, 
  Copy, 
  Check, 
  Code2, 
  Terminal, 
  Zap,
  Globe,
  Radio,
  FileCheck,
  Video
} from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../data/contracts';
import { LEVEL_3_COMMITS } from '../data/commits';
import { formatAddress } from '../utils/stellar';

interface ArchitectureDocsProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ArchitectureDocs: React.FC<ArchitectureDocsProps> = ({ onShowToast }) => {
  const [activeDocTab, setActiveDocTab] = useState<'architecture' | 'commits' | 'deployment'>('architecture');
  const [copiedAddressKey, setCopiedAddressKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddressKey(key);
    onShowToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedAddressKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Docs Header & Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Production Architecture & Dossier</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete technical specification, verified contract addresses, and git commit history
                </p>
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveDocTab('architecture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDocTab === 'architecture' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Architecture & Security
            </button>
            <button
              onClick={() => setActiveDocTab('deployment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDocTab === 'deployment' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deployment & Explorer
            </button>
            <button
              onClick={() => setActiveDocTab('commits')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeDocTab === 'commits' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Git History (13 Commits)
            </button>
          </div>
        </div>

        {/* TAB 1: ARCHITECTURE & SECURITY */}
        {activeDocTab === 'architecture' && (
          <div className="pt-6 space-y-6">
            
            {/* Top 3 Core Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="p-2.5 w-fit rounded-xl bg-indigo-500/20 text-indigo-400 mb-2">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">1. Inter-Contract Calls (ICC)</h3>
                <p className="text-slate-400 leading-relaxed">
                  The <code className="text-indigo-300">StellarVaultContract</code> dynamically invokes <code className="text-indigo-300">SorobanPriceOracle::get_latest_price</code> and <code className="text-indigo-300">StellarTokenEngine::transfer</code> atomically within a single host environment transaction frame.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="p-2.5 w-fit rounded-xl bg-emerald-500/20 text-emerald-400 mb-2">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">2. State Expiration & TTL Buffers</h3>
                <p className="text-slate-400 leading-relaxed">
                  All instance & persistent user balances utilize <code className="text-emerald-300">env.storage().extend_ttl(threshold, extend_by)</code> to prevent state archival while optimizing ledger storage rental footprint.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="p-2.5 w-fit rounded-xl bg-cyan-500/20 text-cyan-400 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">3. Soroban Auth v2 Guardrails</h3>
                <p className="text-slate-400 leading-relaxed">
                  Explicit authorization via <code className="text-cyan-300">address.require_auth()</code> ensures zero unauthorized fund transfers or oracle parameter overrides, matching Stellar SEP standards.
                </p>
              </div>
            </div>

            {/* Architecture Code Diagram */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5">
              <h4 className="font-bold text-white text-sm mb-3">Inter-Contract Invocation Topology</h4>
              <div className="font-mono text-xs text-slate-300 bg-slate-900/90 p-4 rounded-xl leading-loose overflow-x-auto">
{`[User / Freighter Wallet]
       │ (1) Soroban Auth Signature
       ▼
┌───────────────────────────────────────────────────────────┐
│               StellarVaultContract (Hub)                  │
│  • Storage: Instance (Admin, Oracle, Token, Metrics)       │
│  • Storage: Persistent (UserShares map with TTL buffer)   │
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │
    (2) get_latest_price()        (3) claim_rewards()
               ▼                             ▼
┌──────────────────────────────┐  ┌─────────────────────────┐
│     SorobanPriceOracle       │  │    YieldDistributor     │
│  • Precision: 8-decimal USD  │  │  • Multiplier: LP Time  │
│  • Staleness check: <50 ldgr │  │  • Dynamic Emissions    │
└──────────────────────────────┘  └─────────────────────────┘`}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DEPLOYMENT & EXPLORER */}
        {activeDocTab === 'deployment' && (
          <div className="pt-6 space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-1">Deployed Stellar Testnet Smart Contracts</h3>
              <p className="text-xs text-slate-400 mb-4">All contracts compiled to WASM32, deployed and verified on Stellar Testnet RPC</p>

              <div className="space-y-3">
                {[
                  { name: 'StellarVaultContract', key: 'VAULT', address: CONTRACT_ADDRESSES.VAULT, tag: 'Core Liquidity Vault' },
                  { name: 'SorobanPriceOracle', key: 'ORACLE', address: CONTRACT_ADDRESSES.ORACLE, tag: 'Decentralized Oracle Feed' },
                  { name: 'StellarTokenEngine', key: 'TOKEN', address: CONTRACT_ADDRESSES.TOKEN, tag: 'SEP-41 Fungible Token' },
                  { name: 'YieldDistributor', key: 'YIELD', address: CONTRACT_ADDRESSES.YIELD, tag: 'Yield Compounder' }
                ].map((item) => {
                  const isCopied = copiedAddressKey === item.key;
                  return (
                    <div key={item.key} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{item.name}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{item.tag}</span>
                        </div>
                        <div className="font-mono text-xs text-cyan-400 mt-1 break-all">{item.address}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(item.address, item.key)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`https://stellar.expert/explorer/testnet/contract/${item.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-400 transition-colors"
                          title="Open on Stellar Expert"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Testnet RPC Info */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-white text-sm block">Stellar RPC Endpoints</span>
              <div className="flex justify-between text-slate-400">
                <span>Soroban RPC:</span>
                <span className="font-mono text-slate-200">https://soroban-testnet.stellar.org</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Horizon API:</span>
                <span className="font-mono text-slate-200">https://horizon-testnet.stellar.org</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Network Passphrase:</span>
                <span className="font-mono text-slate-200">Test SDF Network ; September 2015</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GIT COMMITS */}
        {activeDocTab === 'commits' && (
          <div className="pt-6 space-y-3">
            <div className="text-xs text-slate-400 pb-2">
              Showing git commit log for the production repository:
            </div>

            <div className="space-y-2.5">
              {LEVEL_3_COMMITS.map((c) => (
                <div key={c.hash} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-900 text-slate-400 mt-0.5">
                      <GitCommitIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span>{c.message}</span>
                        {c.badge && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-1">
                        {c.author} • {c.timestamp}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-emerald-400">+{c.insertions}</span>
                    <span className="text-rose-400">-{c.deletions}</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-bold">{c.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
