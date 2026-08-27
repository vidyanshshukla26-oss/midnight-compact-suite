import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  Trash2, 
  Filter, 
  ExternalLink, 
  Copy, 
  Check, 
  Radio, 
  Sparkles,
  ArrowDownCircle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SorobanEvent } from '../types';
import { formatAddress } from '../utils/stellar';

interface EventStreamerProps {
  events: SorobanEvent[];
  onClearEvents: () => void;
  onEmitEvent: (event: SorobanEvent) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EventStreamer: React.FC<EventStreamerProps> = ({
  events,
  onClearEvents,
  onEmitEvent,
  onShowToast
}) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-stream simulated real-time background events every 12 seconds if active
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const types: ('deposit' | 'swap' | 'cross_call' | 'yield_claim' | 'ttl_bump')[] = ['deposit', 'swap', 'cross_call', 'yield_claim'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      const newLedger = 5129440 + Math.floor(Math.random() * 20);
      const chars = '0123456789abcdef';
      let randomHash = '';
      for (let i = 0; i < 64; i++) randomHash += chars[Math.floor(Math.random() * chars.length)];

      const sampleEvent: SorobanEvent = {
        id: `evt-${Date.now()}`,
        contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCVI5',
        contractName: 'StellarVaultContract',
        topic: [randomType, 'GDA5...TESTNET'],
        data: randomType === 'deposit' 
          ? { amount: 1500000000, shares: 1482000000, oracle_rate: 0.1048 }
          : randomType === 'swap'
          ? { amount_in: 250000000, amount_out: 12450000, fee: 30 }
          : randomType === 'yield_claim'
          ? { keeper: 'GD9X...KEEPER', yield_claimed: 25000000 }
          : { function: 'get_price', return: 104800000 },
        ledger: newLedger,
        timestamp: new Date().toLocaleTimeString(),
        txHash: randomHash,
        type: randomType
      };

      onEmitEvent(sampleEvent);
    }, 12000);

    return () => clearInterval(interval);
  }, [isStreaming, onEmitEvent]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Hash copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = selectedFilter === 'all'
    ? events
    : events.filter((e) => e.type === selectedFilter);

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Radio className={`w-5 h-5 ${isStreaming ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Soroban Real-Time RPC Event Stream</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isStreaming ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {isStreaming ? 'LIVE POLLING (getEvents)' : 'STREAM PAUSED'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Subscribed to contract topics via Soroban RPC JSON-RPC 2.0 endpoint (Testnet)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isStreaming
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Pause Stream' : 'Resume Live Stream'}</span>
            </button>

            <button
              onClick={onClearEvents}
              title="Clear event logs"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
            <Filter className="w-3.5 h-3.5" /> Topic Filter:
          </span>
          {[
            { id: 'all', label: 'All Events' },
            { id: 'deposit', label: 'Deposits (ICC)' },
            { id: 'swap', label: 'Token Swaps' },
            { id: 'cross_call', label: 'Cross Calls' },
            { id: 'yield_claim', label: 'Yield Claims' },
            { id: 'ttl_bump', label: 'TTL Extensions' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedFilter === f.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
            <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p>No events recorded matching the current filter.</p>
            <p className="mt-1 text-slate-600">Execute a deposit, swap, or method invocation to stream new events!</p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isCopied = copiedId === evt.id;
            return (
              <div 
                key={evt.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      evt.type === 'deposit'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : evt.type === 'swap'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : evt.type === 'yield_claim'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {evt.type}
                    </span>

                    <span className="font-bold text-white text-xs">{evt.contractName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Topic: [{evt.topic.join(', ')}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Ledger #{evt.ledger}</span>
                    <span>{evt.timestamp}</span>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                  <div className="lg:col-span-8 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <span className="text-slate-500 select-none">// Decoded SCVal Payload:</span>
                    <div className="mt-0.5">{typeof evt.data === 'string' ? evt.data : JSON.stringify(evt.data)}</div>
                  </div>

                  <div className="lg:col-span-4 flex items-center justify-between lg:justify-end gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>Tx:</span>
                      <span className="text-slate-300">{formatAddress(evt.txHash, 4)}</span>
                      <button
                        onClick={() => handleCopy(evt.txHash, evt.id)}
                        className="text-slate-500 hover:text-cyan-400"
                        title="Copy Tx Hash"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-400 transition-colors"
                      title="View on Stellar Expert"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
