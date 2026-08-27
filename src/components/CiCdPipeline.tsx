import React, { useState } from 'react';
import { 
  GitBranch, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Terminal, 
  FileCode, 
  Copy, 
  Check, 
  ShieldCheck,
  Server,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CICD_STAGES, GITHUB_WORKFLOW_YAML } from '../data/cicd';
import { CiCdStage } from '../types';

interface CiCdPipelineProps {
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const CiCdPipeline: React.FC<CiCdPipelineProps> = ({ onShowToast }) => {
  const [stages, setStages] = useState<CiCdStage[]>(CICD_STAGES);
  const [activeStageId, setActiveStageId] = useState<string>('stage-test');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'pipeline' | 'yaml'>('pipeline');
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);

  const selectedStage = stages.find((s) => s.id === activeStageId) || stages[0];

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(GITHUB_WORKFLOW_YAML);
    setCopiedYaml(true);
    onShowToast('GitHub Actions YAML copied to clipboard', 'info');
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleTriggerPipeline = async () => {
    setIsTriggering(true);

    // Reset stages to pending
    setStages((prev) =>
      prev.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'running' : 'pending'
      }))
    );

    for (let i = 0; i < stages.length; i++) {
      setActiveStageId(stages[i].id);
      await new Promise((r) => setTimeout(r, 650));

      setStages((prev) => {
        const copy = [...prev];
        copy[i].status = 'success';
        if (i + 1 < copy.length) copy[i + 1].status = 'running';
        return copy;
      });
    }

    setIsTriggering(false);
    onShowToast('GitHub Actions CI/CD workflow run #482 completed with 100% success!', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* CI/CD Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <GitBranch className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>GitHub Actions CI/CD Pipeline</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    STATUS: ALL PASSING
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated Rustfmt, Clippy, Soroban tests, WASM optimization, Testnet deployment, and Frontend E2E
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView(activeView === 'pipeline' ? 'yaml' : 'pipeline')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>{activeView === 'pipeline' ? 'View deploy.yml' : 'View Visual Pipeline'}</span>
            </button>

            <button
              id="trigger-pipeline-btn"
              onClick={handleTriggerPipeline}
              disabled={isTriggering}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isTriggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isTriggering ? 'Pipeline Running...' : 'Trigger Workflow Dispatch'}</span>
            </button>
          </div>
        </div>

        {activeView === 'pipeline' ? (
          <div className="pt-6 space-y-6">
            
            {/* Visual Stage Pipeline Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {stages.map((stage, index) => {
                const isSelected = activeStageId === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStageId(stage.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all relative ${
                      isSelected
                        ? 'bg-slate-800 border-purple-500/80 ring-1 ring-purple-500/50 shadow-lg'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500">Step {index + 1}</span>
                      {stage.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : stage.status === 'running' ? (
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-700 inline-block" />
                      )}
                    </div>
                    <div className="font-bold text-white text-xs truncate">{stage.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{stage.durationSeconds}s runtime</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Stage Output Logs */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white text-xs">{selectedStage.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Runner: {selectedStage.runner}</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                  {selectedStage.status.toUpperCase()}
                </span>
              </div>

              {/* Commands Executed */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Commands Executed:</span>
                {selectedStage.commands.map((cmd, i) => (
                  <div key={i} className="font-mono text-xs text-indigo-300 bg-slate-900 px-3 py-1.5 rounded-lg">
                    $ {cmd}
                  </div>
                ))}
              </div>

              {/* Log stream */}
              <div className="space-y-1 bg-slate-900/80 p-3.5 rounded-xl font-mono text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold mb-1">
                  Runner Console Output:
                </span>
                {selectedStage.logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* YAML Workflow View */
          <div className="pt-6 space-y-3">
            <div className="flex justify-between items-center bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="font-mono text-slate-400">.github/workflows/deploy.yml</span>
              <button
                onClick={handleCopyYaml}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedYaml ? 'Copied' : 'Copy Workflow YAML'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-[500px] leading-relaxed">
              <code>{GITHUB_WORKFLOW_YAML}</code>
            </pre>
          </div>
        )}

      </div>

    </div>
  );
};
