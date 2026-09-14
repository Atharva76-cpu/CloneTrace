import React, { useState } from 'react';

// Helpers
const safePercent = (val) => val != null ? `${val}%` : 'UNAVAILABLE';
const isMissing = (val) => val == null;

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(err => console.error(err));
}

function truncateHash(hash) {
  if (!hash || hash.length < 16) return hash || 'N/A';
  return `${hash.slice(0,8)}...${hash.slice(-8)}`;
}

// 1. First Impression / Score Cards
function ScoreCard({ title, score, colorClass, interpretation, available }) {
  const displayScore = available ? `${score}%` : 'UNAVAILABLE';
  return (
    <div className={`p-6 rounded shadow border-t-4 bg-white flex flex-col justify-between ${colorClass}`}>
      <div>
        <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">{title}</h3>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Static-analysis confidence</p>
      </div>
      <div className="text-4xl font-black text-gray-900 mb-2">{displayScore}</div>
      <div className="text-sm font-semibold text-gray-600 border-t pt-2 mt-2">{interpretation}</div>
      {!available && <div className="text-xs text-red-500 font-bold mt-2">Evidence Unavailable</div>}
    </div>
  );
}

// 8. Identity Panel
function IdentityPanel({ baseline, candidate }) {
  const certDiff = baseline.certificate_sha256 !== candidate.certificate_sha256;
  const pkgDiff = baseline.package_name !== candidate.package_name;

  const renderSide = (title, info, isCandidate) => (
    <div className={`flex-1 p-6 ${isCandidate ? 'bg-gray-50 border-l' : 'bg-white'}`}>
      <h3 className="text-sm font-bold text-gray-500 tracking-widest mb-4 uppercase">{title}</h3>
      <div className="space-y-4">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Package</div>
          <div className={`font-mono text-sm font-bold ${isCandidate && pkgDiff ? 'text-red-600 bg-red-50 p-1 rounded inline-block' : 'text-gray-900'}`}>{info.package_name || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">App Label</div>
          <div className="text-sm font-bold text-gray-900">{info.app_label || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Version</div>
          <div className="text-sm font-bold text-gray-900">{info.version_name || 'N/A'}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Certificate SHA256</div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`font-mono text-xs font-bold ${isCandidate && certDiff ? 'text-red-600 bg-red-50 p-1 rounded' : 'text-gray-600 bg-gray-100 p-1 rounded'}`} title={info.certificate_sha256}>
              {truncateHash(info.certificate_sha256)}
            </span>
            {info.certificate_sha256 && (
              <button onClick={() => copyToClipboard(info.certificate_sha256)} className="text-xs text-blue-500 hover:underline font-bold">Copy</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg mb-8 overflow-hidden flex border border-gray-200">
      {renderSide("Original APK", baseline, false)}
      <div className="flex items-center justify-center bg-gray-100 px-4">
        <span className="text-gray-400 font-bold text-2xl">→</span>
      </div>
      {renderSide("Candidate APK", candidate, true)}
    </div>
  );
}

// 3. Smoking Gun
function SmokingGun({ verdict, smokingGun, security }) {
  if (!smokingGun && (!security || security.security_sensitive_changes === 0)) return null;
  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-8 rounded shadow-sm">
      <h3 className="text-red-800 font-black text-lg tracking-widest uppercase mb-2">Smoking Gun Evidence</h3>
      {smokingGun && <p className="text-red-900 font-bold mb-4">{smokingGun}</p>}
      <ul className="space-y-2">
        {security?.correlations?.map((c, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-red-600 mr-2 font-black">•</span>
            <span className="text-red-800 font-medium"><strong>{c.rule}:</strong> {c.explanation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 9. Security Delta
function SecurityDelta({ security }) {
  if (!security || security.total_changes === 0) return null;
  return (
    <div className="bg-gray-900 text-white rounded shadow p-6 mb-8">
      <h3 className="text-lg font-black tracking-widest text-red-500 mb-4 uppercase">Security Delta Detected</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-gray-700 p-4 rounded bg-black">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Added Permissions</div>
          <div className="text-2xl font-black text-red-500">{security.permissions_added || 0}</div>
        </div>
        <div className="border border-gray-700 p-4 rounded bg-black">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Added Endpoints</div>
          <div className="text-2xl font-black text-red-500">{security.endpoints_added || 0}</div>
        </div>
        <div className="border border-gray-700 p-4 rounded bg-black">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sensitive Changes</div>
          <div className="text-2xl font-black text-yellow-500">{security.security_sensitive_changes || 0}</div>
        </div>
      </div>
    </div>
  );
}

// 5. Clone DNA
function CloneDNA({ cloneDna }) {
  if (!cloneDna) return null;
  return (
    <div className="bg-white rounded shadow p-6 mb-8 border border-gray-200">
      <h3 className="text-lg font-black tracking-widest text-gray-800 mb-4 uppercase">Evidence Dimensions (Clone DNA)</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(cloneDna).map(([key, val]) => {
          const isAvail = val.availability;
          return (
            <div key={key} className={`border p-4 rounded text-center ${!isAvail ? 'bg-gray-50 border-dashed' : ''}`}>
              <div className="text-xs uppercase font-bold text-gray-500 mb-1">{key}</div>
              {isAvail ? (
                <div className="text-xl font-black text-gray-800">{val.score}%</div>
              ) : (
                <div className="text-sm font-black text-red-500 mt-2">UNAVAILABLE</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. What Changed (Delta)
function DeltaView({ delta }) {
  const [tab, setTab] = useState('ADDED');

  const getEvidenceList = (type) => {
    let list = [];
    if (!delta) return list;
    const categories = ['identity', 'visual', 'resources', 'manifest', 'network', 'native', 'api'];
    categories.forEach(cat => {
      if (delta[cat] && delta[cat][type.toLowerCase()]) {
        list.push(...delta[cat][type.toLowerCase()].map(e => ({...e, deltaType: type})));
      }
    });
    return list;
  };

  const evidence = getEvidenceList(tab);

  return (
    <div className="bg-white rounded shadow p-6 mb-8 border border-gray-200">
      <h3 className="text-lg font-black tracking-widest text-gray-800 mb-4 uppercase">What Changed?</h3>
      <div className="flex space-x-2 border-b mb-4">
        {['PRESERVED', 'ADDED', 'MODIFIED', 'REMOVED'].map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`pb-2 px-4 text-sm font-bold uppercase tracking-widest transition-colors ${tab === t ? 'border-b-4 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t}
          </button>
        ))}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {evidence.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500 font-medium">No {tab.toLowerCase()} evidence found.</td></tr>
            ) : evidence.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-700 uppercase text-xs">{item.category}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-800">{item.signal}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{item.difference || item.explanation || 'Matches baseline'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. Evidence Breakdown
function EvidenceBreakdown({ contributions }) {
  const [open, setOpen] = useState(false);
  if (!contributions || !contributions.clone) return null;

  const cloneContribs = contributions.clone;
  const total = Object.values(cloneContribs).reduce((a,b) => a+b, 0).toFixed(2);

  return (
    <div className="bg-white rounded shadow p-6 mb-8 border border-gray-200">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center text-lg font-black tracking-widest text-gray-800 uppercase">
        <span>How was Clone Confidence calculated?</span>
        <span>{open ? '−' : '+'}</span>
      </button>
      
      {open && (
        <div className="mt-6 border-t pt-4">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs uppercase text-gray-500 font-bold bg-gray-50">
              <tr>
                <th className="px-4 py-2">Signal Category</th>
                <th className="px-4 py-2 text-right">Points Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(cloneContribs).map(([sig, val]) => (
                <tr key={sig}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 uppercase">{sig.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{val.toFixed(2)} pts</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-black">
              <tr>
                <td className="px-4 py-3 text-right text-gray-700">TOTAL SCORE =</td>
                <td className="px-4 py-3 text-right text-black">{total}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// 7. Signal Disagreement
function SignalDisagreement({ disagreements }) {
  if (!disagreements || disagreements.length === 0) return null;
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8 rounded shadow-sm">
      <h3 className="text-yellow-800 font-black text-lg tracking-widest uppercase mb-4">Signal Disagreements</h3>
      <ul className="space-y-3">
        {disagreements.map((d, i) => (
          <li key={i} className="text-yellow-900 bg-yellow-100 p-4 rounded text-sm font-medium">
            <span className="font-black uppercase block mb-1 text-yellow-800">{d.signal_disagreement}</span>
            {d.explanation}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Dashboard({ results, onReset }) {
  const [judgeMode, setJudgeMode] = useState(false);

  const cloneScore = results.scores?.clone;
  const brandScore = results.scores?.brand;
  const threatScore = results.scores?.threat;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "clonetrace_report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (judgeMode) {
    return (
      <div className="max-w-5xl mx-auto bg-black text-white p-10 rounded-xl shadow-2xl animate-fade-in relative">
        <button onClick={() => setJudgeMode(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white font-bold text-sm tracking-widest">EXIT JUDGE MODE</button>
        <h2 className="text-sm font-bold tracking-widest text-blue-500 mb-2 uppercase">Verdict</h2>
        <div className="text-6xl font-black mb-8 leading-none tracking-tighter text-red-500">{results.verdict}</div>
        
        <div className="grid grid-cols-3 gap-8 mb-8 border-t border-gray-800 pt-8">
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Clone</div>
            <div className="text-4xl font-black">{safePercent(cloneScore)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Brand</div>
            <div className="text-4xl font-black">{safePercent(brandScore)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Threat</div>
            <div className="text-4xl font-black text-red-500">{safePercent(threatScore)}</div>
          </div>
        </div>

        {results.smoking_gun && (
          <div className="bg-red-900 border-l-4 border-red-500 p-6 mb-8 rounded">
            <div className="text-red-300 font-bold text-sm uppercase tracking-widest mb-2">Smoking Gun</div>
            <div className="text-xl font-bold text-white">{results.smoking_gun}</div>
          </div>
        )}

        <div className="border-t border-gray-800 pt-8 flex justify-between items-center">
          <div className="text-gray-400 text-sm font-mono">{results.candidate_summary?.package_name}</div>
          <button onClick={handleExport} className="bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 uppercase tracking-widest text-sm">Export Report</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onReset} className="text-sm font-bold text-gray-500 hover:text-black tracking-widest uppercase">← New Analysis</button>
        <div className="space-x-4">
          <button onClick={handleExport} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-50 shadow-sm text-sm uppercase tracking-widest">Export JSON</button>
          <button onClick={() => setJudgeMode(true)} className="bg-blue-600 text-white px-6 py-2 rounded font-black hover:bg-blue-700 shadow-lg tracking-widest text-sm uppercase">Enter Judge Mode</button>
        </div>
      </div>

      <IdentityPanel baseline={results.baseline_summary} candidate={results.candidate_summary} />

      {/* 2. Verdict Hero */}
      <div className={`p-10 rounded-lg shadow mb-8 text-center border-t-8 ${results.scores?.threat > 40 ? 'bg-red-50 border-red-600' : 'bg-white border-blue-600'}`}>
        <h2 className="text-sm font-bold text-gray-500 tracking-widest mb-2 uppercase">Final Forensic Verdict</h2>
        <div className={`text-5xl font-black tracking-tighter mb-4 ${results.scores?.threat > 40 ? 'text-red-700' : 'text-gray-900'}`}>
          {results.verdict}
        </div>
        <p className="text-lg text-gray-600 font-medium max-w-3xl mx-auto">{results.verdict_reason}</p>
      </div>

      {/* 1. Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreCard 
          title="Clone Confidence" 
          score={cloneScore} 
          colorClass="border-blue-500" 
          available={cloneScore !== null}
          interpretation={cloneScore > 60 ? "High structural overlap detected." : "Structurally divergent."}
        />
        <ScoreCard 
          title="Brand Confidence" 
          score={brandScore} 
          colorClass="border-purple-500" 
          available={brandScore !== null}
          interpretation={brandScore > 60 ? "High visual/identity imitation." : "Distinct brand identity."}
        />
        <ScoreCard 
          title="Threat Confidence" 
          score={threatScore} 
          colorClass="border-red-500" 
          available={threatScore !== null}
          interpretation={threatScore > 40 ? "Malicious additions detected." : "No significant security deviations."}
        />
      </div>

      <SmokingGun verdict={results.verdict} smokingGun={results.smoking_gun} security={results.security} />
      
      <SignalDisagreement disagreements={results.intelligence?.signal_disagreements} />
      
      <SecurityDelta security={results.security} />

      <CloneDNA cloneDna={results.intelligence?.clone_dna} />

      <EvidenceBreakdown contributions={results.contributions} />

      <DeltaView delta={results.delta} />
      
    </div>
  );
}
