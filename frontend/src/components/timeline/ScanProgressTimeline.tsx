import React from 'react';
import { useScanStore } from '../../store/scanStore';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 1, label: 'Fetching target HTML source content' },
  { id: 2, label: 'Parsing Document Object Model (DOM) elements' },
  { id: 3, label: 'Scanning payment signatures database' },
  { id: 4, label: 'Executing security risk heuristics audit' },
  { id: 5, label: 'Compiling security audit report' },
];

export const ScanProgressTimeline: React.FC = () => {
  const { scanningStep } = useScanStore();

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-navy-100 rounded-2xl p-8 shadow-xl mt-12">
      <div className="flex flex-col items-center justify-center mb-8">
        <Loader2 className="h-10 w-10 text-safety-green animate-spin mb-3" />
        <h3 className="text-lg font-bold text-navy-950">Security Audit in Progress</h3>
        <p className="text-xs text-navy-300">Evaluating checkout integration points...</p>
      </div>

      <div className="space-y-6">
        {STEPS.map((step, idx) => {
          const isCompleted = scanningStep > idx;
          const isActive = scanningStep === idx;
          
          return (
            <div key={step.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-safety-green shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 text-navy-900 animate-spin shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-navy-200 shrink-0" />
                )}
                <span className={`text-sm font-medium transition-colors ${
                  isCompleted ? 'text-navy-900 line-through opacity-50' : isActive ? 'text-navy-900 font-bold' : 'text-navy-300'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
                  className="text-xs font-semibold text-safety-green uppercase tracking-wider bg-safety-green-bg px-2 py-0.5 rounded-full"
                >
                  ACTIVE
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ScanProgressTimeline;
