import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Cpu, 
  Database, 
  ShieldCheck,
  Terminal,
  FileCode,
  Layers
} from 'lucide-react';
import { TransactionRecord } from '../types';
import { formatAddress } from '../utils/stellar';

interface TransactionModalProps {
  tx: TransactionRecord | null;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  tx,
  onClose,
  onShowToast
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedXdr, setCopiedXdr] = useState(false);

  if (!tx) return null;

  const handleCopy = (text: string, type: 'hash' | 'xdr') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedXdr(true);
      setTimeout(() => setCopiedXdr(false), 2000);
    }
    onShowToast('Copied to clipboard', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Soroban Transaction Receipt</h3>
              <div className="text-xs text-slate-400 font-mono">Ledger #{tx.ledger} • {tx.timestamp}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans text-xs">
          
          {/* Status & Contract Invocation */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20 font-mono">
                {tx.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Contract Invoked</span>
              <span className="text-white font-mono font-bold">{tx.contract}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Method</span>
              <span className="text-cyan-400 font-mono font-bold">{tx.method}()</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Authorized Signer</span>
              <span className="text-slate-300 font-mono">{formatAddress(tx.authAddress, 6)}</span>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Transaction Hash</span>
              <div className="font-mono text-xs text-cyan-400 break-all">{tx.txHash}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleCopy(tx.txHash, 'hash')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
                title="Copy Hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-400 transition-colors"
                title="View on Stellar Expert"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Soroban Resource Metering */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">CPU Cost</span>
              <div className="font-mono font-bold text-white mt-0.5">{tx.cpuInstructions.toLocaleString()} inst.</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Memory</span>
              <div className="font-mono font-bold text-white mt-0.5">{(tx.memoryBytes / 1024).toFixed(1)} KB</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Gas Fee</span>
              <div className="font-mono font-bold text-cyan-400 mt-0.5">{tx.fee} XLM</div>
            </div>
          </div>

          {/* Cross-Call Traces (ICC) */}
          {tx.crossCallTrace && tx.crossCallTrace.length > 0 && (
            <div className="bg-purple-950/30 p-3.5 rounded-xl border border-purple-500/30 space-y-1.5">
              <span className="text-purple-300 font-bold block text-[11px]">Inter-Contract Invocations (ICC Trace):</span>
              {tx.crossCallTrace.map((call, idx) => (
                <div key={idx} className="font-mono text-[11px] text-purple-200 flex items-center justify-between">
                  <span>↳ {call.fromContract} → {call.method}</span>
                  <span className="text-emerald-400 font-bold text-[10px]">{call.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Return Value */}
          {tx.returnValue && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-1">Return Value (SCVal)</span>
              <div className="font-mono text-emerald-400 font-bold">{tx.returnValue}</div>
            </div>
          )}

          {/* XDR Envelope */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">XDR Base64 Envelope</span>
              <button
                onClick={() => handleCopy(tx.xdrEnvelope, 'xdr')}
                className="text-cyan-400 hover:text-cyan-300 font-mono text-[10px] flex items-center gap-1"
              >
                {copiedXdr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedXdr ? 'Copied XDR' : 'Copy XDR'}</span>
              </button>
            </div>
            <div className="font-mono text-[10px] text-slate-400 break-all bg-slate-900 p-2 rounded">
              {tx.xdrEnvelope}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs transition-colors"
          >
            Close Receipt
          </button>
        </div>

      </div>
    </div>
  );
};
