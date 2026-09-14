import React, { useState } from 'react';
import Dashboard from './Dashboard';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const [view, setView] = useState('UPLOAD'); // UPLOAD, DASHBOARD, BENCHMARK

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/analyze', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const data = await res.json();
      setResults(data);
      setView('DASHBOARD');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setView('UPLOAD');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-8 border-b pb-4 max-w-7xl mx-auto flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">CLONETRACE</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium tracking-wide">STATIC ANALYSIS FORENSIC ENGINE</p>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => setView('UPLOAD')} className={`text-sm font-bold ${view === 'UPLOAD' ? 'text-black' : 'text-gray-400 hover:text-gray-700'}`}>ANALYSIS</button>
          <button onClick={() => setView('BENCHMARK')} className={`text-sm font-bold ${view === 'BENCHMARK' ? 'text-black' : 'text-gray-400 hover:text-gray-700'}`}>BENCHMARK</button>
        </div>
      </header>

      {view === 'BENCHMARK' && <BenchmarkView />}

      {view === 'UPLOAD' && (
        <form onSubmit={handleUpload} className="bg-white p-8 rounded shadow max-w-2xl mx-auto">
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-widest">Baseline APK (Original)</label>
            <input type="file" name="baseline" accept=".apk" required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200" />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-widest">Candidate APK (Suspect)</label>
            <input type="file" name="candidate" accept=".apk" required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-3 px-4 rounded hover:bg-gray-800 disabled:opacity-50 transition">
            {loading ? 'INGESTING APK & ANALYZING EVIDENCE...' : 'ANALYZE FORENSIC EVIDENCE'}
          </button>
          {error && <p className="text-red-500 mt-4 text-sm font-bold">{error}</p>}
        </form>
      )}

      {view === 'DASHBOARD' && results && <Dashboard results={results} onReset={reset} />}
    </div>
  );
}

function BenchmarkView() {
  const [data, setData] = useState(null);
  
  React.useEffect(() => {
    fetch('http://localhost:8000/api/v1/benchmark')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(e => console.error(e));
  }, []);

  if (!data) return <div className="text-center font-bold text-gray-500 mt-20">Loading Benchmark Results...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-black mb-2">CONTROLLED BENCHMARK SEPARATION</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-3xl">This view demonstrates the forensic separation gap between a true Trojanized Clone (B10) and an Unrelated Control App (B11) using the V3 discriminative architecture. Note: Separation does not equate to statistical accuracy; it proves deterministic evidence logic.</p>
      
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-xs">Variant</th>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-xs">Clone Score</th>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-xs">Threat Score</th>
              <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider text-xs">Verdict</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(data).map(([k, v]) => (
              <tr key={k} className={k === 'B10' ? 'bg-red-50' : k === 'B11' ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{k}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">{v.clone_score}%</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">{v.threat_score}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-semibold">{v.verdict}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data['B10'] && data['B11'] && (
        <div className="mt-6 bg-black text-white p-6 rounded shadow flex justify-between items-center">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">B10 vs B11 Separation Margin</div>
            <div className="text-3xl font-black mt-1">{data['B10'].clone_score - data['B11'].clone_score} Points</div>
          </div>
          <div className="text-right text-sm text-gray-400 max-w-md">
            The V3 Engine successfully drops the completely unrelated B11 Flashlight app below the clone threshold while accurately flagging the B10 malicious Calculator clone.
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
