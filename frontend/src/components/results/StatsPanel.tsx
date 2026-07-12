import React from 'react';
import type { ScanStats } from '../../types';
import { FileCode, Layers, Play, Clock } from 'lucide-react';

interface StatsPanelProps {
  stats: ScanStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const items = [
    {
      label: 'Scripts Audited',
      value: stats.num_scripts_analyzed,
      icon: FileCode,
      color: 'text-navy-900 bg-navy-100',
    },
    {
      label: 'Forms Walked',
      value: stats.num_forms_analyzed,
      icon: Layers,
      color: 'text-safety-green bg-safety-green-bg',
    },
    {
      label: 'DOM Elements parsed',
      value: stats.num_elements_analyzed,
      icon: Play,
      color: 'text-warning-amber bg-amber-50',
    },
    {
      label: 'Execution Duration',
      value: `${(stats.duration_seconds * 1000).toFixed(1)}ms`,
      icon: Clock,
      color: 'text-navy-800 bg-navy-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-md">
      <h3 className="font-bold text-sm tracking-wider uppercase text-navy-300 mb-6">Scan Metrics & Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center space-x-4 p-4 border border-navy-50 rounded-lg bg-navy-50/10">
              <div className={`p-3 rounded-lg shrink-0 ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-navy-300 block">{item.label}</span>
                <span className="text-xl font-extrabold text-navy-950 block mt-0.5">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default StatsPanel;
