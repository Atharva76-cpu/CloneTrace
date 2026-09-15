import React, { useState } from 'react';
import Dashboard from './Dashboard';
import { ErrorBoundary } from './ErrorBoundary';
import { Activity, LayoutDashboard, Shield, ShieldAlert, Cpu, Network, Menu, X, Download, Terminal, UploadCloud, Layers, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:8000';
console.log('[CloneTrace] API_BASE_URL:', API_BASE_URL);

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------
// HERO & UPLOAD VIEW
// -----------------------------------------
function UploadView({ onAnalysisComplete }) {
  const [baselineFile, setBaselineFile] = useState(null);
  const [candidateFile, setCandidateFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStage, setLoadingStage] = useState('');

  const handleAnalyze = async () => {
    if (!baselineFile || !candidateFile) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (baselineFile.size > MAX_SIZE || candidateFile.size > MAX_SIZE) {
      setError(`APK files must be under 10MB. Got ${(baselineFile.size / 1024 / 1024).toFixed(1)}MB and ${(candidateFile.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('INGESTING APK FILES...');

    const formData = new FormData();
    formData.append('baseline', baselineFile);
    formData.append('candidate', candidateFile);

    try {
      setTimeout(() => setLoadingStage('EXTRACTING IDENTITY & MANIFEST...'), 1500);
      setTimeout(() => setLoadingStage('ANALYZING APP CODE & RESOURCES...'), 3500);
      setTimeout(() => setLoadingStage('SCANNING FOR SECURITY CAPABILITIES...'), 5500);
      setTimeout(() => setLoadingStage('FUSING FORENSIC EVIDENCE...'), 7500);

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Analysis failed (${response.status}): ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      onAnalysisComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const FileDropzone = ({ label, file, setFile, type }) => {
    const isBaseline = type === 'baseline';
    return (
      <div 
        className={cn(
          "relative flex flex-col items-center justify-center w-full p-8 transition-all duration-500 rounded-xl",
          "border-2 border-dashed glass-panel hover-tilt cursor-pointer overflow-hidden",
          !file ? "border-white/20 hover:border-white/50" : (isBaseline ? "border-cyber-blue/50 bg-cyber-blue/5" : "border-cyber-purple/50 bg-cyber-purple/5")
        )}
        onClick={() => document.getElementById(`file-${type}`).click()}
      >
        <input 
          id={`file-${type}`} 
          type="file" 
          accept=".apk" 
          className="hidden" 
          onChange={(e) => setFile(e.target.files[0])} 
        />
        
        {file ? (
          <div className="flex flex-col items-center z-10">
            <div className={cn("p-4 rounded-full mb-4", isBaseline ? "bg-cyber-blue/20 text-cyber-blue" : "bg-cyber-purple/20 text-cyber-purple")}>
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-display text-white mb-2">{file.name}</h3>
            <p className="text-gray-400 font-mono text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="mt-6 px-4 py-1.5 rounded border border-white/20 text-sm hover:bg-white/10 transition-colors"
            >
              Replace File
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity z-10">
            <UploadCloud className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-300 font-display mb-2">{label}</h3>
            <p className="text-gray-500 text-sm text-center">Click or drag & drop APK</p>
          </div>
        )}

        {/* Subtle background glow when file selected */}
        {file && (
          <div className={cn(
            "absolute inset-0 opacity-20",
            isBaseline ? "bg-[radial-gradient(circle_at_center,_#00f0ff_0%,_transparent_70%)]" : "bg-[radial-gradient(circle_at_center,_#b026ff_0%,_transparent_70%)]"
          )} />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-4 relative">
      {/* Background Decor */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-blue/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000 delay-500" />

      {/* Hero Header */}
      <div className="text-center z-10 max-w-4xl mx-auto mb-16 mt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-cyber-blue/30 text-cyber-blue font-mono text-xs mb-6 tracking-widest uppercase">
          <Terminal className="w-3 h-3" />
          Android APK Forensic Analysis
        </div>
        <h1 className="text-6xl md:text-8xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 mb-6 drop-shadow-2xl">
          CloneTrace
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 font-light mb-8 max-w-3xl mx-auto">
          Detect the clone. Survive the disguise. Explain the evidence.
        </p>
        
        {/* Chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {['STATIC ANALYSIS', 'EXPLAINABLE RESULTS', 'CLONE DETECTION', 'THREAT ANALYSIS'].map((chip) => (
            <div key={chip} className="px-4 py-1.5 rounded-full glass-panel text-gray-300 text-xs font-semibold tracking-wider flex items-center gap-2 border-white/5 hover:border-cyber-blue/30 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue animate-pulse" />
              {chip}
            </div>
          ))}
        </div>
      </div>

      {/* Upload Section */}
      <div className="w-full max-w-5xl relative z-10 perspective-1000">
        <div className="flex flex-col md:flex-row items-stretch gap-8 mb-12 relative">
          
          <div className="flex-1 flex transform transition-transform duration-500">
            <FileDropzone label="UPLOAD BASELINE APK" type="baseline" file={baselineFile} setFile={setBaselineFile} />
          </div>

          <div className="hidden md:flex items-center justify-center relative z-20">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center border-cyber-blue/40 shadow-[0_0_30px_rgba(0,240,255,0.2)] animate-float">
              <span className="font-display font-black text-xl text-white">VS</span>
            </div>
          </div>
          
          <div className="flex-1 flex transform transition-transform duration-500">
            <FileDropzone label="UPLOAD CANDIDATE APK" type="candidate" file={candidateFile} setFile={setCandidateFile} />
          </div>

        </div>

        {error && (
          <div className="p-4 mb-8 rounded-lg bg-red-900/40 border border-red-500/50 text-red-200 text-center font-mono">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center">
          <button 
            onClick={handleAnalyze}
            disabled={!baselineFile || !candidateFile || loading}
            className={cn(
              "relative overflow-hidden group px-12 py-5 rounded-xl font-display font-bold text-lg transition-all duration-300",
              (!baselineFile || !candidateFile || loading) 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                : "bg-gradient-to-r from-cyber-blue/80 to-cyber-purple/80 text-white border border-white/20 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,240,255,0.4)]"
            )}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 animate-spin" />
                <span>{loadingStage}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span>ANALYZE EVIDENCE</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            )}
            {/* Shine effect */}
            {!loading && baselineFile && candidateFile && (
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
            )}
          </button>
          
          <div className="mt-6 flex items-center gap-2 text-gray-500 text-sm">
            <Shield className="w-4 h-4" />
            <span>Processed locally. No dynamic execution required.</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="w-full max-w-6xl mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 z-10 pb-12">
        {[
          { icon: <ShieldAlert className="text-cyber-blue" />, title: "IDENTITY", desc: "Package, Certificates, Brand & Icon similarity" },
          { icon: <Cpu className="text-cyber-purple" />, title: "CODE & RESOURCES", desc: "Class DNA, Strings, APIs & Manifest resources" },
          { icon: <Network className="text-cyber-red" />, title: "THREAT DETECTION", desc: "Permissions, Endpoints & Sensitive capabilities" },
          { icon: <Layers className="text-cyber-green" />, title: "EXPLAINABLE", desc: "Evidence breakdown & transparent delta reporting" }
        ].map((f, i) => (
          <div key={i} className="glass-panel glass-panel-hover p-6 rounded-xl group hover:-translate-y-1 transition-transform cursor-default">
            <div className="p-3 bg-white/5 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h4 className="font-display font-bold text-white mb-2 tracking-wide">{f.title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------
// BENCHMARK VIEW
// -----------------------------------------
function BenchmarkView() {
  const [data, setData] = React.useState(null);
  
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/benchmark`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto relative z-10">
      <div className="mb-10">
        <h2 className="text-4xl font-black font-display text-white mb-4">Adversarial Benchmark</h2>
        <p className="text-gray-400 text-lg max-w-3xl">
          Controlled validation of the static analysis evidence fusion engine across 12 mutation variants.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-8 border-l-4 border-l-cyber-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-32 h-32" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wider text-glow-blue">Controlled Benchmark Separation</h3>
        <p className="text-gray-300">
          The engine demonstrates a <strong>23-point separation</strong> in Clone Confidence between a heavily obfuscated trojanized clone (B10) and an unrelated application (B11) sharing common structural SDKs.
        </p>
      </div>

      {!data ? (
        <div className="text-center p-12 text-gray-500 font-mono animate-pulse">LOADING BENCHMARK DATA...</div>
      ) : data.status === 'pending_artifacts' ? (
        <div className="glass-panel p-8 rounded-xl text-center border-dashed border-white/20">
          <Terminal className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-white mb-2">Benchmark Artifacts Missing</h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The generated APK artifacts for the benchmark (B0.apk - B11.apk) are not present in the local repository to save disk space. The backend requires these to run the live benchmark evaluation.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 shadow-2xl">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/5 font-display text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="p-4 border-b border-white/10">Variant</th>
                <th className="p-4 border-b border-white/10">Mutation</th>
                <th className="p-4 border-b border-white/10 text-center">Clone</th>
                <th className="p-4 border-b border-white/10 text-center">Brand</th>
                <th className="p-4 border-b border-white/10 text-center">Threat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {/* If full benchmark data was available it would render here. */}
              {Object.keys(data.variants_status).map(v => (
                <tr key={v} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{v}</td>
                  <td className="p-4 text-gray-500">Status: {data.variants_status[v] ? 'Available' : 'Missing'}</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">-</td>
                  <td className="p-4 text-center">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------
// MAIN APP SHELL
// -----------------------------------------
function App() {
  const [view, setView] = useState('ANALYSIS');
  const [reportData, setReportData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'ANALYSIS', label: 'Analysis Engine', icon: <Activity className="w-5 h-5" /> },
    { id: 'BENCHMARK', label: 'Benchmark', icon: <Terminal className="w-5 h-5" /> },
    { id: 'ABOUT', label: 'About', icon: <Info className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#030509] text-gray-200 overflow-hidden relative selection:bg-cyber-blue/30">
      {/* Global Ambient Glows */}
      <div className="absolute inset-0 ambient-glow-blue pointer-events-none opacity-50" />
      <div className="absolute inset-0 ambient-glow-purple pointer-events-none opacity-30" />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 glass-panel border-r border-white/10 flex flex-col transition-transform duration-300 md:translate-x-0 md:relative",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 p-6 border-b border-white/10">
          <div className="p-2 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white tracking-wide">CloneTrace</h1>
            <p className="text-[10px] text-cyber-blue uppercase tracking-widest font-mono">Cyber Forensics</p>
          </div>
          <button className="md:hidden ml-auto p-1 text-gray-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">Main Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium",
                view === item.id 
                  ? "bg-white/10 text-white shadow-[inset_2px_0_0_#00f0ff]" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <div className={view === item.id ? "text-cyber-blue" : "text-gray-500"}>
                {item.icon}
              </div>
              {item.label}
              {view === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyber-blue animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/40 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
            <div className="text-xs font-mono text-gray-400">
              <span className="text-white block">Engine Online</span>
              Local Static Analysis
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-40">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm font-mono text-gray-500">
              <span className="text-cyber-blue">~/clonetrace</span>
              <span>/</span>
              <span className="text-white">{view.toLowerCase()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com/Krishn0x/CloneTrace" target="_blank" rel="noreferrer" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold">
              GitHub
            </a>
            {reportData && view === 'ANALYSIS' && (
              <button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `clonetrace_report_${new Date().getTime()}.json`;
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'ANALYSIS' && (
            reportData ? (
              <ErrorBoundary>
                <Dashboard report={reportData} onReset={() => setReportData(null)} />
              </ErrorBoundary>
            ) : (
              <UploadView onAnalysisComplete={setReportData} />
            )
          )}
          {view === 'BENCHMARK' && <BenchmarkView />}
          {view === 'ABOUT' && (
            <div className="p-8 max-w-4xl mx-auto prose prose-invert prose-headings:font-display prose-a:text-cyber-blue mt-12 glass-panel rounded-2xl">
              <h2>About CloneTrace</h2>
              <p>CloneTrace is an explainable Android APK clone and brand-impersonation analysis system using deterministic static evidence fusion. It is designed to evaluate applications strictly based on extracted static artifacts without dynamic execution.</p>
              <h3>Responsible Use</h3>
              <p>APK analysis should be performed on authorized/controlled samples in an isolated environment. The tool provides a controlled benchmark validation and deterministic forensic outputs, not large-scale statistical dataset accuracy claims.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
