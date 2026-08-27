import React, { useState } from 'react';
import { 
  FileCode, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Terminal, 
  Code2, 
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { SorobanContract, ContractMethod, TransactionRecord, SorobanEvent, WalletAccount } from '../types';
import { MOCK_SOROBAN_CONTRACTS } from '../data/contracts';
import { formatAddress, generateMockTxHash, generateMockXdr } from '../utils/stellar';

interface ContractExplorerProps {
  wallet: WalletAccount;
  onRecordTransaction: (tx: TransactionRecord) => void;
  onEmitEvent: (event: SorobanEvent) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onInspectTx: (tx: TransactionRecord) => void;
}

export const ContractExplorer: React.FC<ContractExplorerProps> = ({
  wallet,
  onRecordTransaction,
  onEmitEvent,
  onShowToast,
  onInspectTx
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>('vault');
  const [activeView, setActiveView] = useState<'invoker' | 'code' | 'schema'>('invoker');
  const [selectedMethodName, setSelectedMethodName] = useState<string>('deposit_with_oracle_check');
  const [formInputs, setFormInputs] = useState<Record<string, string>>({
    depositor: wallet.publicKey,
    amount: '1000000000',
    min_shares_out: '980000000',
    asset_pair: 'XLM_USD',
    price: '105000000',
    sender: wallet.publicKey,
    amount_in: '500000000',
    min_amount_out: '24000000',
    caller: wallet.publicKey,
    threshold: '20000',
    extend_by: '100000'
  });
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    status: 'SUCCESS' | 'FAILED';
    output: string;
    cpuInstructions: number;
    memoryBytes: number;
    fee: number;
    crossCalls: string[];
    logs: string[];
  } | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const currentContract = MOCK_SOROBAN_CONTRACTS.find((c) => c.id === selectedContractId) || MOCK_SOROBAN_CONTRACTS[0];
  const currentMethod = currentContract.methods.find((m) => m.name === selectedMethodName) || currentContract.methods[0];

  const handleCopy = (text: string, type: 'addr' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'addr') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    onShowToast('Copied to clipboard', 'info');
  };

  const handleInputChange = (name: string, value: string) => {
    setFormInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleExecuteMethod = async (method: ContractMethod) => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      await new Promise((r) => setTimeout(r, 800));

      const txHash = generateMockTxHash();
      const cpu = Math.floor(120000 + Math.random() * 80000);
      const memory = Math.floor(32000 + Math.random() * 15000);
      const fee = 0.00012;

      let resultVal = 'Ok(())';
      const crossCallsMade: string[] = [];
      const logsGenerated: string[] = [
        `[Soroban Host] Invoking contract: ${currentContract.name}::${method.name}`,
        `[Soroban Auth] Verified signature for ${formatAddress(wallet.publicKey, 4)}`,
      ];

      if (method.name === 'deposit_with_oracle_check') {
        resultVal = 'Ok(985000000 shares)';
        crossCallsMade.push('SorobanPriceOracle::get_latest_price("XLM_USD") -> 105000000');
        logsGenerated.push('[Inter-Contract Call] Invoking Oracle contract CA76YO...');
        logsGenerated.push('[Event Published] Topic: (deposit, depositor), Data: (amount, shares)');
      } else if (method.name === 'swap_exact_tokens_cross_call') {
        resultVal = 'Ok(24920000 USDC)';
        crossCallsMade.push('StellarTokenEngine::transfer() -> Ok(())');
        logsGenerated.push('[Inter-Contract Call] Invoking Token Contract transfer');
      } else if (method.name === 'harvest_and_reinvest') {
        resultVal = 'Ok(25000000 stroops compounded)';
        crossCallsMade.push('YieldDistributor::claim_rewards() -> 25000000');
      } else if (method.name === 'get_latest_price') {
        resultVal = '104800000 ($0.1048 USD/XLM)';
      } else if (method.name === 'get_vault_metrics') {
        resultVal = JSON.stringify({
          total_staked_xlm: '14258900000000',
          total_shares: '14045016500000',
          last_oracle_price: 104800000,
          active_users: 148,
          last_rebalance_ledger: 5129420
        }, null, 2);
      }

      setExecutionResult({
        status: 'SUCCESS',
        output: resultVal,
        cpuInstructions: cpu,
        memoryBytes: memory,
        fee,
        crossCalls: crossCallsMade,
        logs: logsGenerated
      });

      const txRecord: TransactionRecord = {
        id: `tx-${Date.now()}`,
        txHash,
        ledger: 5129440 + Math.floor(Math.random() * 50),
        timestamp: new Date().toLocaleTimeString(),
        contract: currentContract.name,
        method: method.name,
        status: 'SUCCESS',
        fee,
        cpuInstructions: cpu,
        memoryBytes: memory,
        authAddress: wallet.publicKey,
        xdrEnvelope: generateMockXdr(currentContract.name, method.name, formInputs),
        returnValue: resultVal,
        crossCallTrace: crossCallsMade.map((cc) => ({
          fromContract: currentContract.name,
          toContract: cc.split('::')[0] || 'Unknown',
          method: cc,
          status: 'SUCCESS'
        }))
      };

      onRecordTransaction(txRecord);

      onEmitEvent({
        id: `evt-${Date.now()}`,
        contractId: currentContract.address,
        contractName: currentContract.name,
        topic: [method.name, formatAddress(wallet.publicKey, 3)],
        data: {
          method: method.name,
          inputs: formInputs,
          output: resultVal
        },
        ledger: txRecord.ledger,
        timestamp: txRecord.timestamp,
        txHash,
        type: 'cross_call'
      });

      onShowToast(`Contract method ${method.name} executed successfully!`, 'success');
    } catch {
      onShowToast('Soroban host execution reverted', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Contract Selector Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_SOROBAN_CONTRACTS.map((contract) => {
          const isSelected = selectedContractId === contract.id;
          return (
            <button
              key={contract.id}
              onClick={() => {
                setSelectedContractId(contract.id);
                setSelectedMethodName(contract.methods[0]?.name || '');
                setExecutionResult(null);
              }}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {contract.version}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {contract.storageType}
                </span>
              </div>
              <div className="font-bold text-white text-sm truncate">{contract.name}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                {formatAddress(contract.address, 6)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Contract Detail Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{currentContract.name}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Soroban Rust Smart Contract
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">{currentContract.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
              <span>{formatAddress(currentContract.address, 8)}</span>
              <button 
                onClick={() => handleCopy(currentContract.address, 'addr')}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                title="Copy Contract Address"
              >
                {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <a
              href={`https://stellar.expert/explorer/testnet/contract/${currentContract.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
              title="View on Stellar Expert"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
            </a>
          </div>
        </div>

        {/* View Toggle Bar (Interactive Invoker vs Source Rust Code vs Storage Schemas) */}
        <div className="flex items-center gap-2 pt-4 border-b border-slate-800/80 pb-4">
          <button
            onClick={() => setActiveView('invoker')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'invoker'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Interactive Method Invoker</span>
          </button>
          <button
            onClick={() => setActiveView('code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'code'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Rust Source Code (`contractimpl`)</span>
          </button>
          <button
            onClick={() => setActiveView('schema')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'schema'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DataKey Storage & TTL Metadata</span>
          </button>
        </div>

        {/* View 1: Interactive Method Invoker */}
        {activeView === 'invoker' && (
          <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Method Selector & Input Form */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Soroban Function
                </label>
                <div className="space-y-1.5">
                  {currentContract.methods.map((method) => {
                    const isSelected = selectedMethodName === method.name;
                    return (
                      <button
                        key={method.name}
                        onClick={() => {
                          setSelectedMethodName(method.name);
                          setExecutionResult(null);
                        }}
                        className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500/80 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-bold text-xs flex items-center gap-2">
                            <span>{method.name}</span>
                            {method.requiresAuth && (
                              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                                Auth v2
                              </span>
                            )}
                            {method.crossCallTarget && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                ICC Cross-Call
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{method.description}</p>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          method.isMutating ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {method.isMutating ? 'Mutating' : 'View (Sim)'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Input Form for Selected Method */}
              {currentMethod && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Function Arguments</span>
                    <span className="text-[11px] text-slate-400 font-mono">Returns: {currentMethod.outputType}</span>
                  </div>

                  {currentMethod.inputs.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-2">No arguments required for this function.</div>
                  ) : (
                    <div className="space-y-3">
                      {currentMethod.inputs.map((input) => (
                        <div key={input.name}>
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-mono text-slate-300">{input.name}</span>
                            <span className="font-mono text-indigo-400">{input.type}</span>
                          </div>
                          <input
                            type="text"
                            value={formInputs[input.name] ?? input.defaultValue ?? ''}
                            onChange={(e) => handleInputChange(input.name, e.target.value)}
                            placeholder={input.placeholder || `Enter ${input.type}`}
                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleExecuteMethod(currentMethod)}
                    disabled={isExecuting}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isExecuting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isExecuting ? 'Executing on Host...' : `Invoke ${currentMethod.name}()`}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Execution Output & Simulation Traces */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Soroban RPC Invocation Trace</span>
                    </span>
                    {executionResult && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {executionResult.status}
                      </span>
                    )}
                  </div>

                  {executionResult ? (
                    <div className="py-3 space-y-3 font-mono text-xs">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Return Value</span>
                        <div className="text-emerald-400 font-bold whitespace-pre-wrap">{executionResult.output}</div>
                      </div>

                      {/* Gas & Resource Metering */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">CPU Instructions</span>
                          <span className="text-slate-200 font-bold">{executionResult.cpuInstructions.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">Memory Footprint</span>
                          <span className="text-slate-200 font-bold">{(executionResult.memoryBytes / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 block">Host Gas Fee</span>
                          <span className="text-cyan-400 font-bold">{executionResult.fee} XLM</span>
                        </div>
                      </div>

                      {/* Cross-Call Traces */}
                      {executionResult.crossCalls.length > 0 && (
                        <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/30">
                          <span className="text-[10px] text-purple-300 font-bold block mb-1">Inter-Contract Invocations (ICC)</span>
                          {executionResult.crossCalls.map((cc, i) => (
                            <div key={i} className="text-[11px] text-purple-200">
                              ↳ {cc}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Log output */}
                      <div className="bg-slate-900 p-2.5 rounded-xl text-[11px] text-slate-400 space-y-1">
                        {executionResult.logs.map((log, i) => (
                          <div key={i}>{log}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-500 text-xs">
                      Select a function and click <strong className="text-slate-400">Invoke</strong> to simulate execution on the Soroban VM and view gas metrics, cross-calls, and return values.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                  <span>Host: Soroban VM v21.0</span>
                  <span>Ledger State: Live Testnet</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* View 2: Rust Source Code Viewer */}
        {activeView === 'code' && (
          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-center bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="font-mono text-slate-400">contracts/{currentContract.id}/src/lib.rs</span>
              <button
                onClick={() => handleCopy(currentContract.codeRust, 'code')}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Rust Code'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{currentContract.codeRust}</code>
            </pre>
          </div>
        )}

        {/* View 3: DataKey Storage Schema & TTL */}
        {activeView === 'schema' && (
          <div className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">Storage Allocation</span>
                <div className="text-base font-bold text-white">{currentContract.storageType} Storage</div>
                <p className="text-slate-400 text-[11px] mt-1">Managed via <code className="text-indigo-300">env.storage().persistent()</code></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">Remaining TTL</span>
                <div className="text-base font-bold text-emerald-400 font-mono">{currentContract.ttlRemaining.toLocaleString()} Ledgers</div>
                <p className="text-slate-400 text-[11px] mt-1">Automatic extension buffer active</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">WASM SHA-256</span>
                <div className="text-xs font-bold text-slate-300 font-mono truncate">{currentContract.wasmHash}</div>
                <p className="text-slate-400 text-[11px] mt-1">Verified on Stellar Network</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-white mb-2">Storage DataKey Enum Definition</h4>
              <pre className="bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-indigo-300">
{`#[contracttype]
pub enum DataKey {
    Admin,
    OracleContract,
    TokenContract,
    YieldContract,
    Metrics,
    UserShares(Address),
    LedgerTTL,
}`}
              </pre>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
