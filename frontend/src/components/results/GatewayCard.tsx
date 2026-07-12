import React from 'react';
import type { GatewayMatch } from '../../types';
import { Award, CheckCircle2 } from 'lucide-react';

interface GatewayCardProps {
  gateways: GatewayMatch[];
}

export const GatewayCard: React.FC<GatewayCardProps> = ({ gateways }) => {
  if (gateways.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md flex items-center justify-center flex-col h-full text-center">
        <CheckCircle2 className="h-12 w-12 text-safety-green mb-3 animate-fade-in" />
        <h3 className="font-bold text-navy-950">No Payment Integrations Detected</h3>
        <p className="text-xs text-navy-300 mt-1 max-w-xs font-medium">
          ✓ Target page contains no active checkout scripts, form targets, or payment button elements.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm tracking-wider uppercase text-navy-300">Payment Gateway</h3>
          <Award className="h-5 w-5 text-safety-green" />
        </div>
        
        <div className="space-y-6">
          {gateways.map((g) => {
            const confidenceColors = {
              High: 'bg-safety-green text-white',
              Medium: 'bg-warning-amber text-white',
              Low: 'bg-navy-800 text-white',
              None: 'bg-navy-100 text-navy-950',
            };

            const barPercentage = g.confidence === 'High' ? 100 : g.confidence === 'Medium' ? 65 : g.confidence === 'Low' ? 30 : 0;

            return (
              <div key={g.name} className="border-b border-navy-50 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-extrabold text-navy-950">{g.name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${confidenceColors[g.confidence]}`}>
                    {g.confidence} Confidence
                  </span>
                </div>
                
                {/* Confidence Bar */}
                <div className="w-full bg-navy-50 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      g.confidence === 'High' ? 'bg-safety-green' : g.confidence === 'Medium' ? 'bg-warning-amber' : 'bg-navy-900'
                    }`}
                    style={{ width: `${barPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-navy-300 font-semibold mt-1">
                  <span>MATCH SCORE: {g.score}</span>
                  <span>{barPercentage}% MATCH QUALITY</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default GatewayCard;
