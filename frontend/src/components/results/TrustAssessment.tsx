import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { TrustAssessment } from '../../types';

interface TrustAssessmentProps {
  trustAssessment: TrustAssessment | null;
}

export const TrustAssessment: React.FC<TrustAssessmentProps> = ({ trustAssessment }) => {
  if (!trustAssessment) {
    return (
      <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md h-full flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm tracking-wider uppercase text-navy-300">Trust Assessment</h3>
          <p className="text-xs text-navy-300 font-medium">Trust assessment data not available.</p>
        </div>
      </div>
    );
  }

  const { status, explanation, risk_score, risk_level } = trustAssessment;

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm tracking-wider uppercase text-navy-300">Trust Assessment</h3>
          {status === 'Needs Investigation' ? (
            <ShieldAlert className="h-5 w-5 text-danger-red animate-pulse" />
          ) : status === 'Review Recommended' ? (
            <AlertTriangle className="h-5 w-5 text-warning-amber" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-safety-green" />
          )}
        </div>

        <div className="space-y-4">
          {status === 'Needs Investigation' ? (
            <>
              <div className="flex items-center space-x-3 text-danger-red">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <span className="text-lg font-extrabold">Needs Investigation</span>
              </div>
              <p className="text-xs text-navy-300 font-medium leading-relaxed">
                {explanation}
              </p>
            </>
          ) : status === 'Review Recommended' ? (
            <>
              <div className="flex items-center space-x-3 text-warning-amber">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <span className="text-lg font-extrabold">Review Recommended</span>
              </div>
              <p className="text-xs text-navy-300 font-medium leading-relaxed">
                {explanation}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3 text-safety-green">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <span className="text-lg font-extrabold">Verified Integration</span>
              </div>
              <p className="text-xs text-navy-300 font-medium leading-relaxed">
                {explanation}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Quick Indicator Badge */}
      <div className="mt-4 pt-4 border-t border-navy-50 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-navy-300">INTEGRITY CHECK:</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          status === 'Needs Investigation'
            ? 'bg-red-50 text-danger-red'
            : status === 'Review Recommended'
            ? 'bg-amber-50 text-warning-amber'
            : 'bg-green-50 text-safety-green'
        }`}>
          {status === 'Needs Investigation'
            ? 'SUSPECTED BEHAVIORS'
            : status === 'Review Recommended'
            ? 'REVIEW RECOMMENDED'
            : 'HEALTHY FLOW'}
        </span>
      </div>
    </div>
  );
};
export default TrustAssessment;
