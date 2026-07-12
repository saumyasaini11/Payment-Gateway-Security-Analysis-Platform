import React from 'react';
import type { HistoryItem } from '../../types';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ComparisonDrawerProps {
  itemA: HistoryItem;
  itemB: HistoryItem;
  onClose: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({ itemA, itemB, onClose }) => {
  // Determine oldest and newest based on timestamp
  const dateA = new Date(itemA.timestamp).getTime();
  const dateB = new Date(itemB.timestamp).getTime();
  
  const [oldScan, newScan] = dateA < dateB ? [itemA, itemB] : [itemB, itemA];

  const gatewayDelta = oldScan.gateways.join(', ') === newScan.gateways.join(', ') 
    ? 'Same' 
    : `Changed (${oldScan.gateways.join(', ') || 'None'} → ${newScan.gateways.join(', ') || 'None'})`;

  const riskDelta = newScan.riskScore - oldScan.riskScore;
  const isRiskIncreased = riskDelta > 0;

  // New Heuristic/Suspicious findings comparison
  const oldSuspiciousSet = new Set(oldScan.envelope.scan_result.suspicious);
  const newFindings = newScan.envelope.scan_result.suspicious.filter(item => !oldSuspiciousSet.has(item));

  return (
    <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex justify-end">
      {/* Backdrop Closer */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl bg-white h-screen shadow-2xl relative z-10 flex flex-col border-l border-navy-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-navy-100 flex items-center justify-between bg-navy-900 text-white">
          <div>
            <h3 className="font-extrabold text-lg">Scan Comparison View</h3>
            <p className="text-xs text-navy-300">Evaluating incremental risk trends over time</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-navy-800 rounded-lg transition-colors text-navy-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Targets details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-navy-50/50 rounded-lg border border-navy-100">
              <span className="text-[10px] uppercase font-bold text-navy-300 block">Baseline Scan</span>
              <span className="text-sm font-bold text-navy-950 block mt-1 truncate">{oldScan.url}</span>
              <span className="text-[10px] text-navy-300 font-semibold block mt-0.5">
                {new Date(oldScan.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-navy-50/50 rounded-lg border border-navy-100">
              <span className="text-[10px] uppercase font-bold text-navy-300 block">Comparison Scan</span>
              <span className="text-sm font-bold text-navy-950 block mt-1 truncate">{newScan.url}</span>
              <span className="text-[10px] text-navy-300 font-semibold block mt-0.5">
                {new Date(newScan.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Gateways comparison */}
          <div className="p-6 border border-navy-100 rounded-xl bg-white shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-300">Gateway Integrations</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-950">Gateway Match</span>
              <span className="text-sm font-bold text-navy-900">{gatewayDelta}</span>
            </div>
          </div>

          {/* Risk score delta */}
          <div className="p-6 border border-navy-100 rounded-xl bg-white shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-300">Risk Variance Analysis</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-navy-950">Risk Delta</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-navy-900">
                  {oldScan.riskScore} → {newScan.riskScore}
                </span>
                {riskDelta !== 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isRiskIncreased 
                      ? 'bg-red-50 text-danger-red' 
                      : 'bg-green-50 text-safety-green'
                  }`}>
                    {isRiskIncreased ? `+${riskDelta} Increased` : `${riskDelta} Decreased`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Findings Diff list */}
          <div className="p-6 border border-navy-100 rounded-xl bg-white shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-300">Incremental Findings Diff</h4>
            
            {newFindings.length > 0 ? (
              <div className="space-y-3">
                {newFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-red-50/50 border-l-4 border-danger-red rounded">
                    <ShieldAlert className="h-5 w-5 text-danger-red shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-danger-red uppercase block">New Threat Identified</span>
                      <p className="text-sm text-navy-950 font-semibold mt-0.5">{finding}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-safety-green text-sm font-medium bg-green-50/50 p-4 rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
                <span>No new suspicious findings detected between these execution scopes.</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default ComparisonDrawer;
