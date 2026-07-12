import React from 'react';
import { useScanStore } from '../store/scanStore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import GatewayCard from '../components/results/GatewayCard';
import RiskGauge from '../components/results/RiskGauge';
import TrustAssessment from '../components/results/TrustAssessment';
import StatsPanel from '../components/results/StatsPanel';
import FindingsAdvisor from '../components/results/FindingsAdvisor';
import EvidencePanel from '../components/results/EvidencePanel';
import { ArrowLeft, Copy, Download, Check } from 'lucide-react';


export const Results: React.FC = () => {
  const { currentScan, clearScan } = useScanStore();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  // Guard: only redirect if no scan data is present on initial mount.
  // Do NOT watch currentScan continuously — that causes a redirect loop when
  // the sidebar navigates away and clearScan() fires simultaneously.
  React.useEffect(() => {
    if (!currentScan) {
      navigate('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: mount-only guard

  if (!currentScan) return null;

  const result = currentScan.scan_result;
  const trustAssessment = result.trust_assessment;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(currentScan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(currentScan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan_${currentScan.request_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-navy-50/30">
      <Navbar title="Analysis Reports" />

      <main className="flex-1 min-h-0 p-8 overflow-y-auto space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Action Row */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { clearScan(); navigate('/'); }}
              className="flex items-center space-x-2 text-sm font-semibold text-navy-800 hover:text-navy-950 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-4 py-2 border border-navy-100 bg-white hover:bg-navy-50 rounded-lg text-xs font-semibold text-navy-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-4 w-4 text-safety-green" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied' : 'Copy raw JSON'}</span>
              </button>

              <button
                onClick={downloadJson}
                className="flex items-center space-x-2 px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Target Metadata Banner */}
          <div className="bg-navy-900 text-white p-6 rounded-xl border border-navy-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider">Scanned Target URL</span>
              <h2 className="text-xl font-extrabold truncate max-w-xl">{result.url}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-navy-300 tracking-wider block">Scan correlation request ID</span>
              <span className="text-xs font-semibold text-navy-200 font-mono block mt-1">{currentScan.request_id}</span>
            </div>
          </div>

          {/* Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GatewayCard gateways={result.gateways} />
            <RiskGauge score={trustAssessment?.risk_score ?? 0} level={trustAssessment?.risk_level ?? 'LOW'} />
            <TrustAssessment trustAssessment={trustAssessment} />
          </div>

          {/* HTML Parsing Stats Grid */}
          <StatsPanel stats={result.statistics} />

          {/* Evidence Panel & Findings side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EvidencePanel gateways={result.gateways} />
            <FindingsAdvisor suspicious={result.suspicious} />
          </div>
        </div>
      </main>
    </div>
  );
};
export default Results;
