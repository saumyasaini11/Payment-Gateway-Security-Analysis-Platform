import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface FindingsAdvisorProps {
  suspicious: string[];
}

export const FindingsAdvisor: React.FC<FindingsAdvisorProps> = ({ suspicious }) => {
  if (suspicious.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-navy-100 p-8 shadow-md flex items-center justify-center flex-col text-center">
        <div className="bg-green-50 p-4 rounded-full text-safety-green mb-4">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">Security Audit Passed</h3>
        <p className="text-xs text-navy-300 mt-1 max-w-sm">
          No suspicious HTML overlays, dynamic document modifications, or insecure iframe structures were flagged.
        </p>
      </div>
    );
  }

  // Parse suspicious strings into structured vulns
  const structuredFindings = suspicious.map((finding) => {
    const isHigh = 
      finding.toLowerCase().includes('iframe') || 
      finding.toLowerCase().includes('hidden') ||
      finding.toLowerCase().includes('suspicious');
      
    const isMedium = 
      finding.toLowerCase().includes('ip address') || 
      finding.toLowerCase().includes('port') ||
      finding.toLowerCase().includes('inline script');

    const severity: 'HIGH' | 'MEDIUM' | 'LOW' = isHigh ? 'HIGH' : isMedium ? 'MEDIUM' : 'LOW';

    let whyItMatters = 'Suspicious elements are often inserted to intercept payment checkout forms or harvest user credentials.';
    let recommendation = 'Verify if this element was intentionally introduced. Ensure all script libraries use exact hashes.';
    
    if (finding.toLowerCase().includes('iframe')) {
      whyItMatters = 'Hidden or tiny iframe elements can be used by malicious actors to load off-origin scripts, clickjack payment inputs, or collect credit card tokens without audit visibility.';
      recommendation = 'Investigate the iframe origin source. Apply restrictive sandbox attributes (e.g. sandbox="allow-scripts") or remove if redundant.';
    } else if (finding.toLowerCase().includes('ip address')) {
      whyItMatters = 'Form action targets that point directly to raw IP addresses bypass DNS-level domain lookups, security rules, and SSL checks, which is a major indicator of phishing or proxy gateways.';
      recommendation = 'Change form destinations to target verified, fully qualified SSL domain names. Block endpoints serving direct IP requests.';
    }

    return {
      severity,
      title: finding.split('. (')[0] || finding,
      evidence: finding.includes('(') ? finding.split('(')[1]?.replace(')', '') : 'Signature matched tag',
      whyItMatters,
      recommendation,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle className="h-5 w-5 text-warning-amber" />
        <h3 className="font-bold text-navy-950">Security Findings & Advisories</h3>
      </div>

      <div className="space-y-6">
        {structuredFindings.map((finding, idx) => {
          const badgeStyles: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
            HIGH: 'bg-red-50 text-danger-red border-danger-red/20',
            MEDIUM: 'bg-amber-50 text-warning-amber border-warning-amber/20',
            LOW: 'bg-navy-50 text-navy-800 border-navy-200',
          };

          return (
            <div 
              key={idx} 
              className="border border-navy-100 rounded-xl overflow-hidden bg-navy-50/5"
            >
              {/* Header */}
              <div className="p-4 border-b border-navy-100 flex items-center justify-between bg-navy-50/20">
                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeStyles[finding.severity]}`}>
                    {finding.severity}
                  </span>
                  <h4 className="text-sm font-bold text-navy-950">{finding.title}</h4>
                </div>
                <AlertCircle className={`h-4 w-4 ${finding.severity === 'HIGH' ? 'text-danger-red' : 'text-warning-amber'}`} />
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="font-bold text-navy-300 block mb-1">WHY IT MATTERS:</span>
                  <p className="text-navy-950 leading-relaxed font-medium">{finding.whyItMatters}</p>
                </div>

                <div>
                  <span className="font-bold text-navy-300 block mb-1">EVIDENCE IDENTIFIED:</span>
                  <code className="block bg-navy-900 text-white p-3 rounded font-mono text-[11px] leading-normal break-all">
                    {finding.evidence}
                  </code>
                </div>

                <div className="bg-navy-50/50 p-4 rounded-lg border border-navy-100">
                  <span className="font-bold text-navy-950 block mb-1 uppercase tracking-wider text-[10px]">RECOMMENDED REMEDIATION:</span>
                  <p className="text-navy-950 leading-relaxed font-semibold">{finding.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default FindingsAdvisor;
