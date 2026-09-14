import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Cpu, Database, Network, Box, Lock, 
  Eye, Type, AppWindow, HardDrive, FileJson, AlertTriangle, 
  CheckCircle, PlusCircle, MinusCircle, Info, Maximize2, X,
  ArrowRight, Layers, Shield
} from 'lucide-react';
import { cn } from './App';

export default function Dashboard({ report, onReset }) {
  const [judgeMode, setJudgeMode] = useState(false);
  const [activeDeltaTab, setActiveDeltaTab] = useState('ADDED');
  const [showEvidence, setShowEvidence] = useState(false);

  if (!report) return null;

  const {
    verdict = 'INSUFFICIENT EVIDENCE',
    verdict_reason = '',
    smoking_gun = '',
    scores = { clone: null, brand: null, threat: 0 },
    contributions = { clone: {}, brand: {}, threat: {} },
    delta = { preserved: [], added: [], modified: [], removed: [] },
    security = null,
    intelligence = null,
    baseline_summary = null,
    candidate_summary = null
  } = report || {};

  // Visuals for Verdict
  const isMalicious = verdict === 'TROJANIZED CLONE' || verdict === 'MALWARE' || verdict === 'THREAT_INJECTED';
  const isClone = verdict === 'EXACT CLONE' || verdict === 'SUSPICIOUS DERIVATIVE';
  
  let verdictColor = 'text-cyber-green border-cyber-green shadow-[0_0_20px_rgba(0,255,102,0.3)]';
  let verdictBg = 'bg-cyber-green/10';
  if (isMalicious || smoking_gun) {
    verdictColor = 'text-cyber-red border-cyber-red shadow-[0_0_30px_rgba(255,42,42,0.4)]';
    verdictBg = 'bg-cyber-red/10';
  } else if (isClone) {
    verdictColor = 'text-cyber-purple border-cyber-purple shadow-[0_0_20px_rgba(176,38,255,0.3)]';
    verdictBg = 'bg-cyber-purple/10';
  }

  // Dimension Icons mapping
  const dimIcons = {
    identity: <Box className="w-5 h-5" />,
    visual: <Eye className="w-5 h-5" />,
    resources: <Database className="w-5 h-5" />,
    code: <Cpu className="w-5 h-5" />,
    api: <AppWindow className="w-5 h-5" />,
    network: <Network className="w-5 h-5" />,
    native: <HardDrive className="w-5 h-5" />
  };

  const ScoreCard = ({ title, score, type }) => {
    const safeScore = score ?? 0;
    let colorClass = 'text-cyber-blue shadow-[0_0_15px_rgba(0,240,255,0.2)]';
    let ringColor = 'stroke-cyber-blue';
    if (type === 'threat') { colorClass = 'text-cyber-red shadow-[0_0_15px_rgba(255,42,42,0.2)]'; ringColor = 'stroke-cyber-red'; }
    if (type === 'brand') { colorClass = 'text-cyber-purple shadow-[0_0_15px_rgba(176,38,255,0.2)]'; ringColor = 'stroke-cyber-purple'; }

    const radius = 35;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (safeScore / 100) * circumference;

    return (
      <div className={cn("glass-panel p-6 rounded-2xl flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-default", colorClass)}>
        <div>
          <h3 className="text-gray-400 font-display uppercase tracking-wider text-xs font-bold mb-1">{title}</h3>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-5xl font-black font-display tracking-tight", colorClass.split(' ')[0])}>{Math.round(safeScore)}</span>
            <span className="text-xl text-gray-500 font-bold">%</span>
          </div>
        </div>
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle className="stroke-white/5" strokeWidth="8" fill="transparent" r={radius} cx="50" cy="50" />
            <circle 
              className={cn("transition-all duration-1000 ease-out", ringColor)}
              strokeWidth="8" 
              strokeLinecap="round"
              fill="transparent" 
              r={radius} 
              cx="50" 
              cy="50"
              style={{ strokeDasharray: circumference, strokeDashoffset }}
            />
          </svg>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------
  // JUDGE MODE OVERLAY
  // -----------------------------------------------------
  if (judgeMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col p-8 overflow-y-auto cyber-grid">
        <div className="absolute inset-0 ambient-glow-red opacity-20 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyber-blue" />
            <h1 className="text-2xl font-black font-display tracking-widest uppercase">CloneTrace Forensic Report</h1>
          </div>
          <button onClick={() => setJudgeMode(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-white/20">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full relative z-10 gap-8">
          <div className={cn("p-10 rounded-3xl border-2 flex flex-col items-center text-center", verdictColor, verdictBg)}>
            <h2 className="text-6xl md:text-8xl font-black font-display uppercase tracking-tighter mb-4 text-glow-red">{verdict}</h2>
            <p className="text-xl text-gray-300 max-w-3xl font-mono">{verdict_reason}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreCard title="Clone Confidence" score={scores.clone ?? 0} type="clone" />
          <ScoreCard title="Brand Confidence" score={scores.brand ?? 0} type="brand" />
          <ScoreCard title="Threat Confidence" score={scores.threat ?? 0} type="threat" />
        </div>

          {smoking_gun && (
            <div className="p-8 rounded-2xl bg-[url('/noise.png')] bg-cyber-red/10 border border-cyber-red shadow-[0_0_40px_rgba(255,42,42,0.2)]">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-cyber-red animate-pulse" />
                <h3 className="text-2xl font-black font-display text-cyber-red tracking-widest uppercase">Smoking Gun</h3>
              </div>
              <p className="text-xl text-white font-mono leading-relaxed">{smoking_gun}</p>
            </div>
          )}

      {security?.findings?.length > 0 && (
         <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-cyber-red">
            <h3 className="text-2xl font-black font-display text-cyber-red tracking-widest uppercase mb-4">Security Delta</h3>
            <ul className="space-y-2">
                {security.findings.map((item, i) => (
                    <li key={i} className="font-mono text-gray-300 flex items-start gap-3"><PlusCircle className="w-5 h-5 text-cyber-red shrink-0" />{item.reason}</li>
                  ))}
               </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // STANDARD DASHBOARD
  // -----------------------------------------------------
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24 relative z-10">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={onReset} className="text-gray-400 hover:text-white flex items-center gap-2 font-mono text-sm uppercase tracking-wider">
          <ArrowRight className="w-4 h-4 rotate-180" />
          New Analysis
        </button>
        <button 
          onClick={() => setJudgeMode(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyber-blue/10 text-cyber-blue font-bold border border-cyber-blue/50 hover:bg-cyber-blue/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all uppercase tracking-widest text-sm"
        >
          <Maximize2 className="w-4 h-4" />
          Enter Judge Mode
        </button>
      </div>

      {/* Identity Panel side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[{ title: 'BASELINE', data: baseline_summary, type: 'safe' }, { title: 'CANDIDATE', data: candidate_summary, type: 'threat' }].map((app, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className={cn("absolute top-0 right-0 p-4 opacity-5 font-black text-8xl italic", app.type === 'safe' ? "text-cyber-blue" : "text-cyber-red")}>
              {i === 0 ? 'B0' : 'CX'}
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 font-mono">{app.title} APK</h3>
             <div className="space-y-4 relative z-10">
               <div>
                 <div className="text-xs text-gray-500 mb-1 uppercase">Package Name</div>
                 <div className="font-mono text-white break-all">{app.data?.metadata?.package_name || app.data?.package_name || 'Unknown'}</div>
               </div>
               <div className="flex gap-8">
                 <div>
                   <div className="text-xs text-gray-500 mb-1 uppercase">App Label</div>
                   <div className="font-display font-bold text-gray-200">{app.data?.metadata?.app_label || app.data?.app_name || app.data?.app_label || 'Unknown'}</div>
                 </div>
                 <div>
                   <div className="text-xs text-gray-500 mb-1 uppercase">Version</div>
                   <div className="font-mono text-gray-200">{app.data?.metadata?.version_name || app.data?.version_name || 'Unknown'}</div>
                 </div>
               </div>
               <div>
                 <div className="text-xs text-gray-500 mb-1 uppercase">Primary Certificate SHA-256</div>
                 <div className="font-mono text-xs text-gray-400 break-all p-2 bg-black/40 rounded border border-white/5 selection:bg-cyber-blue/30">
                   {app.data?.certificates?.[0]?.sha256 || 'Unsigned / Unavailable'}
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Verdict Hero */}
      <div className={cn("rounded-3xl border-2 p-8 md:p-12 text-center relative overflow-hidden backdrop-blur-xl", verdictColor, verdictBg)}>
        <div className="absolute inset-0 cyber-grid opacity-20 mix-blend-overlay pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-black font-display uppercase tracking-widest mb-4 relative z-10 drop-shadow-2xl">{verdict}</h2>
        <p className="text-lg md:text-xl text-gray-200 font-mono max-w-3xl mx-auto relative z-10 leading-relaxed">{verdict_reason}</p>
      </div>

      {/* Smoking Gun (Conditionally Rendered) */}
      {smoking_gun && (
        <div className="glass-panel border-l-4 border-l-cyber-red p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-cyber-red/10 to-transparent pointer-events-none" />
          <div className="flex gap-4 relative z-10">
            <div className="mt-1">
              <div className="w-10 h-10 rounded-full bg-cyber-red/20 flex items-center justify-center border border-cyber-red/50 shadow-[0_0_15px_rgba(255,42,42,0.4)] animate-pulse">
                <AlertTriangle className="w-5 h-5 text-cyber-red" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-cyber-red uppercase tracking-widest mb-2">Smoking Gun Evidence</h3>
              <p className="text-gray-200 font-mono leading-relaxed text-sm md:text-base">{smoking_gun}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signal Disagreements */}
      {intelligence?.signal_disagreements?.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyber-purple mt-6">
          <h3 className="text-lg font-black font-display text-cyber-purple uppercase tracking-widest mb-4 flex items-center gap-2">
            <Network className="w-5 h-5" /> Intelligence Disagreement
          </h3>
          <div className="space-y-4">
            {intelligence.signal_disagreements.map((dis, i) => (
              <div key={i} className="bg-black/40 p-4 rounded-xl border border-white/5">
                <h4 className="font-bold font-mono text-white mb-2">{dis.signal_disagreement}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{dis.explanation}</p>
                <div className="mt-3 flex gap-2">
                  {dis.affected_signals.map(sig => (
                    <span key={sig} className="px-2 py-1 bg-cyber-purple/20 text-cyber-purple text-[10px] uppercase font-bold rounded">
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard title="Clone Confidence" score={scores.clone ?? 0} type="clone" />
        <ScoreCard title="Brand Confidence" score={scores.brand ?? 0} type="brand" />
        <ScoreCard title="Threat Confidence" score={scores.threat ?? 0} type="threat" />
      </div>

      {/* Clone DNA Grid */}
      <div>
        <h3 className="text-xl font-bold font-display text-white mb-6 uppercase tracking-wider flex items-center gap-3">
          <Database className="w-5 h-5 text-cyber-blue" />
          Clone DNA Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(intelligence?.clone_dna || {}).map(([dim, data]) => (
            <div key={dim} className="glass-panel p-4 rounded-xl border border-white/5 hover:border-cyber-blue/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-500 group-hover:text-cyber-blue transition-colors">
                  {dimIcons[dim] || <Info className="w-4 h-4" />}
                </div>
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mb-1" title={dim.replace('_', ' ')}>
                {dim.replace('_', ' ')}
              </div>
              <div>
                {data.availability ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-display text-white group-hover:text-cyber-blue transition-colors">{data.score}</span>
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono font-bold text-cyber-red/80 py-1 uppercase inline-block">
                    Unavailable
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Delta */}
      {security?.findings?.length > 0 && (
        <div>
          <h3 className="text-xl font-bold font-display text-white mb-6 uppercase tracking-wider flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-cyber-red" />
            Security Delta
          </h3>
          <div className="glass-panel rounded-2xl overflow-hidden border border-cyber-red/20 shadow-[0_0_20px_rgba(255,42,42,0.1)]">
            <div className="p-4 bg-cyber-red/10 border-b border-cyber-red/20 text-cyber-red font-mono text-sm font-bold uppercase flex justify-between items-center">
              <span>High Risk Additions Detected</span>
              <span className="px-2 py-0.5 rounded bg-cyber-red text-black">{security.findings.length}</span>
            </div>
            <div className="p-4 divide-y divide-white/5">
               {security.findings.map((item, i) => (
                 <div key={i} className="py-3 font-mono text-sm text-gray-300 flex items-start gap-3">
                   <PlusCircle className="w-4 h-4 text-cyber-red shrink-0 mt-0.5" />
                   <span className="break-all">{item.reason}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* What Changed (Delta Viewer) */}
      <div>
        <h3 className="text-xl font-bold font-display text-white mb-6 uppercase tracking-wider flex items-center gap-3">
          <Layers className="w-5 h-5 text-cyber-purple" />
          Forensic Delta (What Changed?)
        </h3>
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="flex overflow-x-auto border-b border-white/10 bg-black/20 hide-scrollbar">
            {['PRESERVED', 'ADDED', 'MODIFIED', 'REMOVED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveDeltaTab(tab)}
                className={cn(
                  "px-6 py-4 text-sm font-bold font-display tracking-widest whitespace-nowrap transition-colors relative",
                  activeDeltaTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {tab}
                {activeDeltaTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyber-blue to-cyber-purple" />
                )}
              </button>
            ))}
          </div>
          <div className="p-6 bg-black/40 min-h-[300px] max-h-[500px] overflow-y-auto">
            <DeltaList data={delta} type={activeDeltaTab.toLowerCase()} />
          </div>
        </div>
      </div>

      {/* Evidence Breakdown Accordion */}
      <div className="glass-panel rounded-2xl overflow-hidden mt-12">
        <button 
          onClick={() => setShowEvidence(!showEvidence)}
          className="w-full p-6 flex justify-between items-center hover:bg-white/5 transition-colors border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-cyber-blue" />
            <h3 className="font-display font-bold uppercase tracking-widest text-white">How was Clone Confidence calculated?</h3>
          </div>
          <div className="text-gray-500 font-mono text-sm flex items-center gap-2">
            Sum = {Math.round(scores.clone)}% 
            <span className={cn("transform transition-transform", showEvidence && "rotate-180")}>▼</span>
          </div>
        </button>
        
        {showEvidence && (
          <div className="p-6 bg-black/20 overflow-x-auto">
            <table className="w-full text-left text-sm font-mono text-gray-300">
              <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="pb-3 pr-4">Signal</th>
                  <th className="pb-3 px-4 text-right">Raw Match</th>
                  <th className="pb-3 px-4 text-right">Weight</th>
                  <th className="pb-3 pl-4 text-right text-cyber-blue">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Object.entries(contributions.clone || {}).map(([key, val]) => (
                  <tr key={key} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-bold text-gray-400 capitalize">{key.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-right">N/A</td>
                    <td className="py-3 px-4 text-right">—</td>
                    <td className="py-3 pl-4 text-right font-black text-cyber-blue">+{Number(val).toFixed(1)} pts</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-white/20">
                  <td colSpan={3} className="py-4 text-right font-display font-bold uppercase tracking-widest text-white">Total Clone Confidence</td>
                  <td className="py-4 text-right font-black text-2xl text-cyber-blue">{(scores.clone ?? 0).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function DeltaList({ data, type }) {
  // Aggregate items across dimensions based on type (PRESERVED, ADDED, MODIFIED, REMOVED)
  const items = [];
  
  const extractItems = (category, icon, label) => {
    if (data[category]) {
      const cat = data[category][type];
      if (cat && Array.isArray(cat)) {
        cat.forEach(evidence => {
          items.push({ 
            icon, 
            label, 
            value: evidence.signal || String(evidence.candidate_value ?? evidence.baseline_value ?? '')
          });
        });
      }
    }
  };

  extractItems('manifest', <ShieldCheck className="w-4 h-4"/>, 'Permission/Component');
  extractItems('network', <Network className="w-4 h-4"/>, 'Endpoint');
  extractItems('resources', <Database className="w-4 h-4"/>, 'Resource');
  extractItems('capabilities', <AlertTriangle className="w-4 h-4"/>, 'Capability');
  extractItems('api', <Cpu className="w-4 h-4"/>, 'API');

  if (items.length === 0) {
    return <div className="text-gray-600 font-mono text-center py-12 italic">No {type} forensic artifacts found.</div>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
          <div className="mt-0.5 text-gray-500 group-hover:text-cyber-blue">{item.icon}</div>
          <div className="font-mono text-sm break-all">
            <span className="text-xs font-bold text-gray-500 uppercase mr-2 bg-black/50 px-2 py-0.5 rounded">{item.label}</span>
            <span className="text-gray-300 group-hover:text-white transition-colors">{item.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
