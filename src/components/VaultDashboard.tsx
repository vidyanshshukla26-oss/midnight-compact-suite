import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowRightLeft, 
  Droplet, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Layers, 
  Cpu, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Zap,
  ArrowUpRight,
  Database,
  Lock,
  Flame,
  ChevronRight,
  Activity
} from 'lucide-react';
import { WalletAccount, TransactionRecord, SorobanEvent } from '../types';
import { CONTRACT_ADDRESSES } from '../data/contracts';
import { formatAddress, generateMockTxHash, generateMockXdr } from '../utils/stellar';

interface VaultDashboardProps {
  wallet: WalletAccount;
  setWallet: React.Dispatch<React.SetStateAction<WalletAccount>>;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onRecordTransaction: (tx: TransactionRecord) => void;
  onEmitEvent: (event: SorobanEvent) => void;
  onNavigateToTab: (tab: string) => void;
  onInspectTx: (tx: TransactionRecord) => void;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  wallet,
  setWallet,
  onShowToast,
  onRecordTransaction,
  onEmitEvent,
  onNavigateToTab,
  onInspectTx
}) => {
  // Vault state
  const [activeActionTab, setActiveActionTab] = useState<'deposit' | 'swap' | 'harvest' | 'ttl'>('deposit');
  const [depositAmount, setDepositAmount] = useState<string>('50');
  const [swapInAmount, setSwapInAmount] = useState<string>('20');
  const [swapDirection, setSwapDirection] = useState<'XLM_TO_USDC' | 'USDC_TO_XLM'>('XLM_TO_USDC');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStepText, setCurrentStepText] = useState<string>('');
  
  // Protocol metrics
  const [tvlXlm, setTvlXlm] = useState<number>(1425890);
  const [oraclePrice, setOraclePrice] = useState<number>(0.1048);
  const [userShares, setUserShares] = useState<number>(125.4);
  const [ttlCount, setTtlCount] = useState<number>(184520);
  const [totalYieldClaimed, setTotalYieldClaimed] = useState<number>(4320);

  // Calculate outputs
  const depositXlmNum = parseFloat(depositAmount) || 0;
  const estimatedShares = depositXlmNum > 0 ? (depositXlmNum * 0.985).toFixed(2) : '0.00';
  const swapInNum = parseFloat(swapInAmount) || 0;
  const estimatedSwapOut = swapDirection === 'XLM_TO_USDC' 
    ? (swapInNum * oraclePrice * 0.997).toFixed(4)
    : (swapInNum / oraclePrice * 0.997).toFixed(2);

  // Execute Deposit with Soroban Inter-Contract Call
  const handleDeposit = async () => {
    if (depositXlmNum <= 0) {
      onShowToast('Please enter a valid deposit amount', 'error');
      return;
    }
    if (wallet.xlmBalance < depositXlmNum) {
      onShowToast('Insufficient XLM balance in wallet. Use Friendbot faucet!', 'error');
      return;
    }

    setIsProcessing(true);
    setCurrentStepText('1/4: Simulating Soroban Host Invocation...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStepText('2/4: Inter-Contract Cross Call -> SorobanPriceOracle::get_price...');
      
      await new Promise((r) => setTimeout(r, 700));
      setCurrentStepText('3/4: Requesting Soroban Auth v2 Signature from Wallet...');

      await new Promise((r) => setTimeout(r, 600));
      setCurrentStepText('4/4: Submitting Transaction to Stellar Testnet RPC...');

      await new Promise((r) => setTimeout(r, 500));

      const txHash = generateMockTxHash();
      const sharesMinted = parseFloat(estimatedShares);

      // Update state
      setWallet((w) => ({
        ...w,
        xlmBalance: Math.max(0, w.xlmBalance - depositXlmNum),
        strlBalance: w.strlBalance + sharesMinted
      }));
      setUserShares((s) => s + sharesMinted);
      setTvlXlm((t) => t + depositXlmNum);

      const txRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        txHash,
        ledger: 5129420 + Math.floor(Math.random() * 50),
        timestamp: new Date().toLocaleTimeString(),
        contract: 'StellarVaultContract',
        method: 'deposit_with_oracle_check',
        status: 'SUCCESS',
        fee: 0.00014,
        cpuInstructions: 184520,
        memoryBytes: 42800,
        authAddress: wallet.publicKey,
        xdrEnvelope: generateMockXdr('VAULT', 'deposit_with_oracle_check', { amount: depositXlmNum }),
        returnValue: `Ok(${sharesMinted} shares)`,
        crossCallTrace: [
          {
            fromContract: 'StellarVaultContract',
            toContract: 'SorobanPriceOracle',
            method: 'get_latest_price("XLM_USD")',
            status: 'SUCCESS'
          },
          {
            fromContract: 'StellarVaultContract',
            toContract: 'StellarTokenEngine',
            method: 'mint_shares(depositor, amount)',
            status: 'SUCCESS'
          }
        ]
      };

      onRecordTransaction(txRecord);

      // Emit Soroban Event
      onEmitEvent({
        id: `evt-${Date.now()}`,
        contractId: CONTRACT_ADDRESSES.VAULT,
        contractName: 'StellarVaultContract',
        topic: ['deposit', formatAddress(wallet.publicKey, 3)],
        data: {
          depositor: wallet.publicKey,
          deposited_xlm: depositXlmNum,
          shares_minted: sharesMinted,
          oracle_price_rate: oraclePrice
        },
        ledger: txRecord.ledger,
        timestamp: txRecord.timestamp,
        txHash,
        type: 'deposit'
      });

      onShowToast(`Successfully deposited ${depositXlmNum} XLM into Vault (Minted ${sharesMinted} Starlight shares)`, 'success');
      onInspectTx(txRecord);
    } catch {
      onShowToast('Transaction failed on Soroban host environment', 'error');
    } finally {
      setIsProcessing(false);
      setCurrentStepText('');
    }
  };

  // Execute Swap with SEP-41 Inter-Contract Call
  const handleSwap = async () => {
    if (swapInNum <= 0) {
      onShowToast('Enter valid swap amount', 'error');
      return;
    }

    if (swapDirection === 'XLM_TO_USDC' && wallet.xlmBalance < swapInNum) {
      onShowToast('Insufficient XLM balance for swap', 'error');
      return;
    }
    if (swapDirection === 'USDC_TO_XLM' && wallet.usdcBalance < swapInNum) {
      onShowToast('Insufficient USDC balance for swap', 'error');
      return;
    }

    setIsProcessing(true);
    setCurrentStepText('Executing Cross-Contract Token Swap via StellarTokenEngine...');

    try {
      await new Promise((r) => setTimeout(r, 900));
      const txHash = generateMockTxHash();
      const outAmount = parseFloat(estimatedSwapOut);

      if (swapDirection === 'XLM_TO_USDC') {
        setWallet((w) => ({
          ...w,
          xlmBalance: w.xlmBalance - swapInNum,
          usdcBalance: w.usdcBalance + outAmount
        }));
      } else {
        setWallet((w) => ({
          ...w,
          usdcBalance: w.usdcBalance - swapInNum,
          xlmBalance: w.xlmBalance + outAmount
        }));
      }

      const txRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        txHash,
        ledger: 5129425 + Math.floor(Math.random() * 50),
        timestamp: new Date().toLocaleTimeString(),
        contract: 'StellarVaultContract',
        method: 'swap_exact_tokens_cross_call',
        status: 'SUCCESS',
        fee: 0.00018,
        cpuInstructions: 215400,
        memoryBytes: 51200,
        authAddress: wallet.publicKey,
        xdrEnvelope: generateMockXdr('VAULT', 'swap_exact_tokens_cross_call', { in: swapInNum, out: outAmount }),
        returnValue: `Ok(${outAmount} tokens)`,
        crossCallTrace: [
          {
            fromContract: 'StellarVaultContract',
            toContract: 'StellarTokenEngine',
            method: 'transfer(sender, vault, amount_in)',
            status: 'SUCCESS'
          },
          {
            fromContract: 'StellarVaultContract',
            toContract: 'SorobanPriceOracle',
            method: 'get_latest_price("XLM_USD")',
            status: 'SUCCESS'
          }
        ]
      };

      onRecordTransaction(txRecord);

      onEmitEvent({
        id: `evt-${Date.now()}`,
        contractId: CONTRACT_ADDRESSES.VAULT,
        contractName: 'StellarVaultContract',
        topic: ['swap', swapDirection],
        data: {
          user: wallet.publicKey,
          amount_in: swapInNum,
          amount_out: outAmount,
          protocol_fee_bps: 30
        },
        ledger: txRecord.ledger,
        timestamp: txRecord.timestamp,
        txHash,
        type: 'swap'
      });

      onShowToast(`Swapped ${swapInNum} ${swapDirection === 'XLM_TO_USDC' ? 'XLM' : 'USDC'} for ${outAmount} ${swapDirection === 'XLM_TO_USDC' ? 'USDC' : 'XLM'}`, 'success');
      onInspectTx(txRecord);
    } finally {
      setIsProcessing(false);
      setCurrentStepText('');
    }
  };

  // Harvest Yield from YieldDistributor
  const handleHarvest = async () => {
    setIsProcessing(true);
    setCurrentStepText('Invoking YieldDistributor::claim_rewards cross-contract...');

    try {
      await new Promise((r) => setTimeout(r, 800));
      const txHash = generateMockTxHash();
      const harvestAmount = 25.0;

      setWallet((w) => ({
        ...w,
        xlmBalance: w.xlmBalance + harvestAmount
      }));
      setTotalYieldClaimed((y) => y + harvestAmount);

      const txRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        txHash,
        ledger: 5129430 + Math.floor(Math.random() * 50),
        timestamp: new Date().toLocaleTimeString(),
        contract: 'StellarVaultContract',
        method: 'harvest_and_reinvest',
        status: 'SUCCESS',
        fee: 0.00012,
        cpuInstructions: 162000,
        memoryBytes: 38400,
        authAddress: wallet.publicKey,
        xdrEnvelope: generateMockXdr('VAULT', 'harvest_and_reinvest', {}),
        returnValue: 'Ok(25000000 stroops compounded)',
        crossCallTrace: [
          {
            fromContract: 'StellarVaultContract',
            toContract: 'YieldDistributor',
            method: 'claim_rewards(vault_address)',
            status: 'SUCCESS'
          }
        ]
      };

      onRecordTransaction(txRecord);

      onEmitEvent({
        id: `evt-${Date.now()}`,
        contractId: CONTRACT_ADDRESSES.YIELD,
        contractName: 'YieldDistributor',
        topic: ['yield', 'harvest_reward'],
        data: {
          keeper: wallet.publicKey,
          reward_claimed_xlm: harvestAmount,
          reinvest_status: 'AUTO_COMPOUNDED'
        },
        ledger: txRecord.ledger,
        timestamp: txRecord.timestamp,
        txHash,
        type: 'yield_claim'
      });

      onShowToast(`Successfully harvested +${harvestAmount} XLM yield rewards!`, 'success');
      onInspectTx(txRecord);
    } finally {
      setIsProcessing(false);
      setCurrentStepText('');
    }
  };

  // Extend TTL
  const handleExtendTtl = async () => {
    setIsProcessing(true);
    setCurrentStepText('Calling env.storage().instance().extend_ttl(50_000, 100_000)...');

    try {
      await new Promise((r) => setTimeout(r, 650));
      const txHash = generateMockTxHash();
      setTtlCount((c) => c + 100000);

      const txRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        txHash,
        ledger: 5129435 + Math.floor(Math.random() * 50),
        timestamp: new Date().toLocaleTimeString(),
        contract: 'StellarVaultContract',
        method: 'bump_storage_ttl',
        status: 'SUCCESS',
        fee: 0.00008,
        cpuInstructions: 94000,
        memoryBytes: 24000,
        authAddress: wallet.publicKey,
        xdrEnvelope: generateMockXdr('VAULT', 'bump_storage_ttl', { extend_by: 100000 }),
        returnValue: 'Ok(())',
      };

      onRecordTransaction(txRecord);

      onEmitEvent({
        id: `evt-${Date.now()}`,
        contractId: CONTRACT_ADDRESSES.VAULT,
        contractName: 'StellarVaultContract',
        topic: ['ttl_bump', 'storage_instance'],
        data: {
          contract: 'StellarVaultContract',
          extended_by_ledgers: 100000,
          new_ttl: ttlCount + 100000
        },
        ledger: txRecord.ledger,
        timestamp: txRecord.timestamp,
        txHash,
        type: 'ttl_bump'
      });

      onShowToast('Contract storage TTL extended by 100,000 ledgers', 'success');
      onInspectTx(txRecord);
    } finally {
      setIsProcessing(false);
      setCurrentStepText('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Value Locked */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Value Locked</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ${(tvlXlm * oraclePrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{tvlXlm.toLocaleString()} XLM</span>
            <span>in Soroban Vault</span>
          </div>
        </div>

        {/* Oracle Rate & Feed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Oracle Price Feed</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
            ${oraclePrice.toFixed(4)}
            <span className="text-xs font-semibold text-emerald-400">+2.4%</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SorobanPriceOracle Feed (Live)</span>
          </div>
        </div>

        {/* Dynamic APY */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Vault APY</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            14.85%
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>YieldDistributor Auto-Compound</span>
          </div>
        </div>

        {/* State TTL Buffer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">State TTL Buffer</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {ttlCount.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Persistent storage active</span>
          </div>
        </div>

      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Action Card (Deposit / Swap / Harvest / TTL) */}
        <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
          
          {/* Action Tabs Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveActionTab('deposit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeActionTab === 'deposit'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Deposit & Stake
              </button>
              <button
                onClick={() => setActiveActionTab('swap')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeActionTab === 'swap'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cross-Swap
              </button>
              <button
                onClick={() => setActiveActionTab('harvest')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeActionTab === 'harvest'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Harvest Yield
              </button>
              <button
                onClick={() => setActiveActionTab('ttl')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeActionTab === 'ttl'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                State TTL
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Soroban Auth v2</span>
            </div>
          </div>

          {/* Action Content Area */}
          <div className="py-5">
            
            {/* TAB 1: DEPOSIT */}
            {activeActionTab === 'deposit' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>Deposit Amount (XLM)</span>
                    <span>Available: <strong className="text-slate-200">{wallet.xlmBalance.toFixed(2)} XLM</strong></span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        onClick={() => setDepositAmount((wallet.xlmBalance * 0.5).toFixed(0))}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-semibold text-slate-300 transition-colors"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => setDepositAmount((wallet.xlmBalance - 2).toFixed(0))}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-semibold text-slate-300 transition-colors"
                      >
                        MAX
                      </button>
                      <span className="font-bold text-sm text-cyan-400 pl-1">XLM</span>
                    </div>
                  </div>
                </div>

                {/* Simulation Breakdown / Inter-Contract Call Preview */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Est. Starlight Shares Minted</span>
                    <span className="font-bold text-white font-mono">{estimatedShares} STRL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cross-Contract Oracle Check</span>
                    <span className="text-cyan-400 font-mono">SorobanPriceOracle (1 XLM = ${oraclePrice})</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Max Slippage Guard</span>
                    <span className="text-emerald-400 font-mono">0.5% (Enforced by Smart Contract)</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span>Estimated Soroban Gas Fee</span>
                    <span className="text-slate-300 font-mono">~0.00014 XLM (184k CPU inst.)</span>
                  </div>
                </div>

                {/* Progress banner when processing */}
                {isProcessing && (
                  <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>{currentStepText}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="deposit-submit-btn"
                  onClick={handleDeposit}
                  disabled={isProcessing || depositXlmNum <= 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Executing Soroban Cross-Call...' : `Deposit ${depositAmount || '0'} XLM to Vault`}</span>
                </button>
              </div>
            )}

            {/* TAB 2: CROSS-SWAP */}
            {activeActionTab === 'swap' && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>You Pay</span>
                    <span>Balance: {swapDirection === 'XLM_TO_USDC' ? `${wallet.xlmBalance.toFixed(2)} XLM` : `$${wallet.usdcBalance.toFixed(2)} USDC`}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={swapInAmount}
                      onChange={(e) => setSwapInAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm text-cyan-400">
                      {swapDirection === 'XLM_TO_USDC' ? 'XLM' : 'USDC'}
                    </div>
                  </div>
                </div>

                {/* Switch Direction Button */}
                <div className="flex justify-center -my-2 relative z-10">
                  <button
                    onClick={() => setSwapDirection(d => d === 'XLM_TO_USDC' ? 'USDC_TO_XLM' : 'XLM_TO_USDC')}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-md"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>You Receive (Estimated)</span>
                    <span className="text-emerald-400 font-medium">Optimal Route</span>
                  </div>
                  <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-lg font-bold text-emerald-400 flex items-center justify-between">
                    <span>{estimatedSwapOut}</span>
                    <span className="text-sm font-bold text-slate-300">
                      {swapDirection === 'XLM_TO_USDC' ? 'USDC' : 'XLM'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Route Engine</span>
                    <span className="text-slate-300 font-mono">StellarTokenEngine (SEP-41)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Inter-Contract Calls</span>
                    <span className="text-indigo-400 font-mono">Vault → TokenEngine → Oracle</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>AMM Fee (0.3%)</span>
                    <span className="text-slate-300 font-mono">0.003</span>
                  </div>
                </div>

                <button
                  id="swap-submit-btn"
                  onClick={handleSwap}
                  disabled={isProcessing || swapInNum <= 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isProcessing ? 'Executing Cross-Contract Swap...' : `Swap ${swapInAmount || '0'} ${swapDirection === 'XLM_TO_USDC' ? 'XLM' : 'USDC'}`}</span>
                </button>
              </div>
            )}

            {/* TAB 3: HARVEST */}
            {activeActionTab === 'harvest' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">YieldDistributor Protocol</h4>
                      <p className="text-xs text-slate-400">Auto-compounds LP rewards and distributes them to stakers</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400">Claimable Yield</span>
                      <div className="text-xl font-bold text-amber-400 font-mono">+25.0 XLM</div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400">Total Harvested</span>
                      <div className="text-xl font-bold text-white font-mono">{totalYieldClaimed.toFixed(1)} XLM</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p>• Triggers inter-contract invocation <code className="text-indigo-300">YieldDistributor::claim_rewards()</code></p>
                  <p>• Automatically extends contract storage TTL upon each successful rebalance.</p>
                </div>

                <button
                  id="harvest-submit-btn"
                  onClick={handleHarvest}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>{isProcessing ? 'Harvesting Cross-Contract...' : 'Harvest & Compound 25.0 XLM'}</span>
                </button>
              </div>
            )}

            {/* TAB 4: STATE TTL EXTENSION */}
            {activeActionTab === 'ttl' && (
              <div className="space-y-4">
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Soroban State Expiration Guard</h4>
                      <p className="text-xs text-slate-400">State archiving prevention via <code className="text-emerald-300 font-mono">env.storage().extend_ttl()</code></p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Current Storage TTL</span>
                      <span className="font-bold text-emerald-400 font-mono">{ttlCount.toLocaleString()} Ledgers (~10.6 days)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[82%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Threshold: 20,000 ledgers</span>
                      <span>Target: 200,000 ledgers</span>
                    </div>
                  </div>
                </div>

                <button
                  id="extend-ttl-submit-btn"
                  onClick={handleExtendTtl}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  <span>{isProcessing ? 'Extending TTL on Host...' : 'Bump Instance TTL (+100,000 Ledgers)'}</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Inter-Contract Architecture Visualizer & Quick Links */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* User Portfolio Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Protocol Position</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">User Shares</span>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Starlight Vault Shares:</span>
                <span className="text-lg font-bold text-white font-mono">{userShares.toFixed(2)} STRL</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Equivalent Underlying Value:</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">
                  {(userShares * 1.015).toFixed(2)} XLM (~${((userShares * 1.015) * oraclePrice).toFixed(2)})
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Governance Weight:</span>
                <span className="text-xs font-semibold text-purple-400">0.088% of Pool</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('events')}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>View Streamed Protocol Events</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Inter-Contract Call Topology Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inter-Contract Architecture</span>
              <button 
                onClick={() => onNavigateToTab('contracts')}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                Inspect Rust Code <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {/* Vault Hub */}
              <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>StellarVaultContract (Hub)</span>
                  </div>
                  <div className="font-mono text-[10px] text-indigo-300 mt-0.5">{formatAddress(CONTRACT_ADDRESSES.VAULT, 6)}</div>
                </div>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded font-mono">Core</span>
              </div>

              {/* Connected Contracts */}
              <div className="pl-4 border-l-2 border-slate-800 space-y-2">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200 text-[11px]">↳ SorobanPriceOracle</div>
                    <div className="text-[10px] text-slate-400">Cross-call: <code className="text-cyan-300">get_latest_price</code></div>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-mono">Active</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200 text-[11px]">↳ StellarTokenEngine (SEP-41)</div>
                    <div className="text-[10px] text-slate-400">Cross-call: <code className="text-cyan-300">transfer, balance</code></div>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-mono">Active</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200 text-[11px]">↳ YieldDistributor</div>
                    <div className="text-[10px] text-slate-400">Cross-call: <code className="text-cyan-300">claim_rewards</code></div>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-mono">Active</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
