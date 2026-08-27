import React, { useState } from 'react';
import { 
  Wallet, 
  Layers, 
  Activity, 
  FileCode, 
  GitBranch, 
  BookOpen, 
  Terminal, 
  ChevronDown, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Droplet
} from 'lucide-react';
import { WalletAccount } from '../types';
import { formatAddress } from '../utils/stellar';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wallet: WalletAccount;
  setWallet: React.Dispatch<React.SetStateAction<WalletAccount>>;
  onFaucet: () => void;
  isFauceting: boolean;
  eventCount: number;
  onOpenTestModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wallet,
  setWallet,
  onFaucet,
  isFauceting,
  eventCount,
  onShowToast
}) => {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Address copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { id: 'dashboard', label: 'dApp Vault', icon: Layers },
    { id: 'contracts', label: 'Smart Contracts', icon: FileCode },
    { id: 'events', label: 'Live Events', icon: Activity, badge: eventCount > 0 ? eventCount : undefined },
    { id: 'tests', label: 'Test Suite', icon: Terminal },
    { id: 'cicd', label: 'CI/CD Pipeline', icon: GitBranch },
    { id: 'docs', label: 'Architecture Docs', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    Starlight
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                    Soroban v21
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-normal">Stellar Smart Contract Protocol</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Network Selector, Faucet, Wallet */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Network Badge */}
            <div className="relative">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="capitalize">{wallet.network}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              
              {showNetworkMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Soroban RPC Network
                  </div>
                  <button
                    onClick={() => {
                      setWallet((w) => ({ ...w, network: 'testnet' }));
                      setShowNetworkMenu(false);
                      onShowToast('Switched to Stellar Testnet RPC', 'info');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      wallet.network === 'testnet' ? 'text-cyan-400 font-semibold bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    <span>Stellar Testnet</span>
                    {wallet.network === 'testnet' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setWallet((w) => ({ ...w, network: 'futurenet' }));
                      setShowNetworkMenu(false);
                      onShowToast('Switched to Futurenet Sandbox', 'info');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      wallet.network === 'futurenet' ? 'text-cyan-400 font-semibold bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    <span>Futurenet (Preview)</span>
                    {wallet.network === 'futurenet' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Testnet Friendbot Faucet */}
            <button
              id="faucet-button"
              onClick={onFaucet}
              disabled={isFauceting}
              title="Request 100 Testnet XLM from Stellar Friendbot"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Droplet className={`w-3.5 h-3.5 ${isFauceting ? 'animate-bounce text-cyan-400' : 'text-indigo-400'}`} />
              <span>{isFauceting ? 'Funding...' : 'Friendbot Faucet'}</span>
            </button>

            {/* Wallet Button */}
            <div className="relative">
              <button
                id="wallet-connect-btn"
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  wallet.connected
                    ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-white shadow-sm'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-transparent shadow-md shadow-cyan-500/20'
                }`}
              >
                <Wallet className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div className="font-semibold leading-none">{wallet.connected ? formatAddress(wallet.publicKey, 4) : 'Connect Wallet'}</div>
                  {wallet.connected && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{wallet.xlmBalance.toFixed(1)} XLM</div>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {/* Wallet Dropdown */}
              {showWalletMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 text-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xs">
                        ⚡
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{wallet.name}</div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Connected
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                      Freighter v5.1
                    </span>
                  </div>

                  <div className="py-3 space-y-2">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>Public Key</span>
                        <button 
                          onClick={() => handleCopy(wallet.publicKey)}
                          className="hover:text-cyan-400 transition-colors flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-slate-300 break-all">
                        {wallet.publicKey}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-slate-800/60 p-2 rounded-lg">
                        <div className="text-[10px] text-slate-400">XLM Balance</div>
                        <div className="text-sm font-bold text-white">{wallet.xlmBalance.toLocaleString()} XLM</div>
                      </div>
                      <div className="bg-slate-800/60 p-2 rounded-lg">
                        <div className="text-[10px] text-slate-400">USDC Balance</div>
                        <div className="text-sm font-bold text-white">${wallet.usdcBalance.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        onFaucet();
                        setShowWalletMenu(false);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500/30"
                    >
                      <Droplet className="w-3.5 h-3.5" /> Request Friendbot Testnet XLM
                    </button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>View on Stellar Expert</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2.5 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[9px] font-bold px-1 rounded-full bg-cyan-400 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
