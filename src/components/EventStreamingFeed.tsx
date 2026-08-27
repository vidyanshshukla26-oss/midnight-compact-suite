import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Pause, 
  Play, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Search
} from 'lucide-react';
import { SorobanEvent } from '../types';

interface EventStreamingFeedProps {
  events: SorobanEvent[];
  setEvents: React.Dispatch<React.SetStateAction<SorobanEvent[]>>;
  ledgerSeq: number;
}

export const EventStreamingFeed: React.FC<EventStreamingFeedProps> = ({
  events,
  setEvents,
  ledgerSeq,
}) => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Background mock event simulator when streaming is active
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.45) {
        const types: ('deposit' | 'swap' | 'yield_claim' | 'ttl_bump')[] = ['deposit', 'swap', 'yield_claim', 'ttl_bump'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomAddr = 'G' + Math.random().toString(36).substring(2, 8).toUpperCase() + '...TESTNET';
        const txHash = '8d9a2c4e' + Math.random().toString(16).substring(2, 10) + '3b1f';

        let dataObj: Record<string, unknown> = {};
        if (randomType === 'deposit') {
          dataObj = { depositor: randomAddr, amountXlm: (Math.random() * 250 + 20).toFixed(2), shares: '142.8 LP' };
        } else if (randomType === 'swap') {
          dataObj = { trader: randomAddr, pair: 'XLM/USDC', amountIn: '75.0 XLM', amountOut: '7.85 USDC' };
        } else if (randomType === 'yield_claim') {
          dataObj = { vault: 'CDLZFC...GCVI5', rewardDistributed: '18.4 XLM', poolApy: '12.4%' };
        } else {
          dataObj = { contract: 'StellarVaultContract', extendedBy: '100,000 ledgers', status: 'Live' };
        }

        const newEvt: SorobanEvent = {
          id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCVI5',
          contractName: 'StellarVaultContract',
          topic: [randomType, randomAddr.slice(0, 6)],
          data: dataObj,
          ledger: ledgerSeq + Math.floor(Math.random() * 3),
          timestamp: new Date().toLocaleTimeString(),
          txHash,
          type: randomType
        };

        setEvents((prev) => [newEvt, ...prev.slice(0, 49)]);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isStreaming, ledgerSeq, setEvents]);

  const filteredEvents = events.filter((evt) => {
    if (filterType !== 'all' && evt.type !== filterType) return false;
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      evt.contractName.toLowerCase().includes(query) ||
      evt.txHash.toLowerCase().includes(query) ||
      evt.topic.some(t => t.toLowerCase().includes(query)) ||
      JSON.stringify(evt.data).toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Streamer Header & Metrics */}
      <div className="bg-[#16191E] border border-[#2A2D35] rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2A2D35]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest">
                Soroban RPC Event Streaming Engine
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Websocket / RPC Poll Active
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Real-Time Contract Event Stream
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all border ${
                isStreaming
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500 hover:bg-emerald-600/30'
                  : 'bg-[#0F1115] text-gray-400 border-[#2A2D35] hover:text-white'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Streaming Live' : 'Stream Paused'}</span>
            </button>

            <button
              onClick={() => setEvents([])}
              className="px-3 py-1.5 bg-[#0F1115] border border-[#2A2D35] hover:border-red-500/50 text-xs font-mono text-gray-400 hover:text-red-400 rounded-lg flex items-center gap-1.5 transition-all"
              title="Clear event history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Feed</span>
            </button>
          </div>
        </div>

        {/* Live Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-1 font-mono text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-gray-500 uppercase text-[10px] font-bold">Filter Topic:</span>
            {['all', 'deposit', 'swap', 'yield_claim', 'ttl_bump'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded transition-all capitalize text-[11px] ${
                  filterType === type
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-[#0F1115] text-gray-400 border border-[#2A2D35] hover:text-gray-200'
                }`}
              >
                {type === 'yield_claim' ? 'Yield' : type}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, hash, contract..."
              className="w-full bg-[#0F1115] border border-[#2A2D35] focus:border-orange-500 rounded pl-8 pr-3 py-1.5 text-xs text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Events Feed Container */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-[#16191E] border border-[#2A2D35] rounded-xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0F1115] border border-[#2A2D35] flex items-center justify-center mx-auto text-gray-600">
              <Radio className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm font-mono text-gray-400">
              No matching events found in current ledger window.
            </p>
            <p className="text-xs font-mono text-gray-600">
              Execute a deposit or swap from the Contract Engine to emit live Soroban events!
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isDeposit = evt.type === 'deposit';
            const isSwap = evt.type === 'swap';
            const isHarvest = evt.type === 'yield_claim';

            return (
              <div
                key={evt.id}
                className="bg-[#16191E] border border-[#2A2D35] hover:border-gray-600 rounded-xl p-4 transition-all space-y-3 font-mono"
              >
                {/* Event Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isDeposit
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isSwap
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : isHarvest
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      TOPIC: {evt.type.toUpperCase()}
                    </span>

                    <span className="text-xs font-bold text-white">{evt.contractName}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {evt.timestamp}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span>Ledger #{evt.ledger.toLocaleString()}</span>
                  </div>
                </div>

                {/* Event Topics & Decoded Data */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0F1115] p-3 rounded-lg border border-[#2A2D35]">
                  {/* Topics */}
                  <div className="md:col-span-4 space-y-1 border-b md:border-b-0 md:border-r border-[#2A2D35] pb-2 md:pb-0 md:pr-3">
                    <span className="text-[10px] uppercase text-gray-500 font-bold block">
                      SCVal Topics ({evt.topic.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {evt.topic.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-[#16191E] border border-[#2A2D35] text-[10px] text-orange-300 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Decoded Data */}
                  <div className="md:col-span-8 space-y-1">
                    <span className="text-[10px] uppercase text-gray-500 font-bold block">
                      Decoded Payload Data
                    </span>
                    <div className="text-xs text-gray-300">
                      {typeof evt.data === 'object' ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(evt.data).map(([key, val]) => (
                            <div key={key} className="text-[11px]">
                              <span className="text-gray-500">{key}:</span>{' '}
                              <span className="text-orange-200 font-bold">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>{String(evt.data)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Transaction Footer */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <span>Tx Hash:</span>
                    <span className="text-gray-400 truncate">{evt.txHash}</span>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 flex items-center gap-1 shrink-0"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
