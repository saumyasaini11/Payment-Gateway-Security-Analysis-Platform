import React from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface RiskGaugeProps {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level }) => {
  const boundedScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
  const getSeverityStyle = () => {
    switch (level) {
      case 'HIGH':
        return {
          text: 'text-danger-red border-danger-red/20 bg-red-50',
          stroke: 'stroke-danger-red',
          color: '#ba1a1a',
          bg: 'text-red-50',
        };
      case 'MEDIUM':
        return {
          text: 'text-warning-amber border-warning-amber/20 bg-amber-50',
          stroke: 'stroke-warning-amber',
          color: '#f59e0b',
          bg: 'text-amber-50',
        };
      default:
        return {
          text: 'text-safety-green border-safety-green/20 bg-green-50',
          stroke: 'stroke-safety-green',
          color: '#10b981',
          bg: 'text-green-50',
        };
    }
  };

  const style = getSeverityStyle();
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md h-full flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm tracking-wider uppercase text-navy-300">Risk Score</h3>
        {level === 'HIGH' ? (
          <ShieldAlert className="h-5 w-5 text-danger-red" />
        ) : level === 'MEDIUM' ? (
          <Shield className="h-5 w-5 text-warning-amber" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-safety-green" />
        )}
      </div>

      <div
        className="relative flex items-center justify-center mt-2"
        role="meter"
        aria-label="Risk score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={boundedScore}
        aria-valuetext={`${boundedScore} out of 100, ${level} risk`}
      >
        {/* SVG Circle Gauge */}
        <svg aria-hidden="true" className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-navy-50"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={50}
            cy={50}
          />
          {/* Progress circle */}
          <circle
            className={`transition-all duration-700 ease-in-out ${style.stroke}`}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx={50}
            cy={50}
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute flex flex-col items-center text-center">
          <span className="text-3xl font-extrabold text-navy-950 leading-none">{boundedScore}</span>
          <span className="text-[10px] uppercase font-bold text-navy-300 mt-1">OF 100</span>
        </div>
      </div>

      {/* Severity Indicator Tag */}
      <div className="w-full mt-6">
        <div className={`w-full py-2 rounded-lg border text-center font-bold text-xs uppercase tracking-widest ${style.text}`}>
          {level} SEVERITY LEVEL
        </div>
      </div>
    </div>
  );
};
export default RiskGauge;
