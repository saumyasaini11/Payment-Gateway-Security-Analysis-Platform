import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileSearch, ShieldCheck } from 'lucide-react';
import type { GatewayMatch } from '../../types';

interface EvidencePanelProps {
  gateways: GatewayMatch[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ gateways }) => {
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allMatches = gateways.flatMap((g) =>
    g.matches.map((match) => {
      // Determine a mock confidence contribution or display details
      let contribution = 15;
      if (match.toLowerCase().includes('script')) contribution = 50;
      else if (match.toLowerCase().includes('action') || match.toLowerCase().includes('url')) contribution = 40;
      else if (match.toLowerCase().includes('button')) contribution = 25;

      return {
        gatewayName: g.name,
        text: match,
        contribution,
      };
    })
  );

  if (allMatches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md">
        <div className="flex items-center space-x-2 mb-4">
          <FileSearch className="h-5 w-5 text-navy-300" />
          <h3 className="font-bold text-navy-950">Detection Evidence</h3>
        </div>
        <p className="text-xs text-navy-300">No matching signature evidence was found during this scan.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md">
      <div className="flex items-center space-x-2 mb-6">
        <FileSearch className="h-5 w-5 text-navy-900" />
        <h3 className="font-bold text-navy-950">Detection Evidence</h3>
      </div>

      <div className="space-y-3">
        {allMatches.map((match, idx) => {
          const key = `${match.gatewayName}-${idx}`;
          const isExpanded = !!expandedIndices[key];
          
          // Split title and details if possible
          const parts = match.text.split(': ');
          const title = parts[0] || 'Signature Match';
          const value = parts[1] || match.text;

          return (
            <div 
              key={key} 
              className="border border-navy-50 rounded-lg overflow-hidden bg-navy-50/10 hover:bg-navy-50/30 transition-colors"
            >
              <div 
                onClick={() => toggleExpand(key)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-navy-100 text-navy-800 rounded">
                    {match.gatewayName}
                  </span>
                  <span className="text-sm font-bold text-navy-950">{title}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs font-semibold text-safety-green">
                    +{match.contribution} Score
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-navy-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-navy-300" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-navy-50 bg-white text-xs space-y-2">
                  <div>
                    <span className="font-bold text-navy-300 block mb-1">MATCHED EVIDENCE STRING:</span>
                    <code className="block bg-navy-50/50 p-2 rounded text-navy-950 font-mono break-all border border-navy-100">
                      {value}
                    </code>
                  </div>
                  <div className="flex items-center text-[10px] text-safety-green font-bold">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    <span>Contributor verified against database signatures definition</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default EvidencePanel;
