import React, { useState } from 'react';
import { useScanStore } from '../store/scanStore';
import type { HistoryItem } from '../types';
import Navbar from '../components/layout/Navbar';
import ComparisonDrawer from '../components/history/ComparisonDrawer';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Award, FileSearch, ArrowRight, CheckSquare, Square } from 'lucide-react';

export const History: React.FC = () => {
  const { scanHistory, setScanResult } = useScanStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  
  // Keep track of checked items for comparison
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // limit to 2
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleRowClick = (item: HistoryItem) => {
    setScanResult(item.envelope);
    navigate('/results');
  };

  const filteredHistory = scanHistory.filter((item) => {
    const matchesSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const selectedItems = scanHistory.filter((item) => selectedIds.includes(item.id));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-navy-50/30">
      <Navbar title="Scan History" />

      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white border border-navy-100 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300" />
              <input
                id="history-search-input"
                aria-label="Search scan history"
                type="text"
                placeholder="Search history by scanned URL target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-navy-200 rounded-lg text-sm bg-navy-50/20 text-navy-950 focus:outline-none focus:ring-1 focus:ring-navy-900 focus:border-transparent transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 shrink-0">
              <div className="flex items-center space-x-2 text-sm text-navy-300">
                <Filter className="h-4 w-4" />
                <span className="font-bold uppercase tracking-wider text-xs">Risk Rating:</span>
              </div>
              
              <div className="flex space-x-1 bg-navy-50 p-1 rounded-lg">
                {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRiskFilter(lvl)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      riskFilter === lvl 
                        ? 'bg-navy-900 text-white shadow-sm' 
                        : 'text-navy-300 hover:text-navy-900'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Compare Button */}
              <button
                disabled={selectedIds.length !== 2}
                onClick={() => setIsCompareOpen(true)}
                className="bg-safety-green hover:bg-safety-green-hover text-white disabled:bg-navy-100 disabled:text-navy-300 font-bold px-4 py-2 rounded-lg text-xs transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <span>Compare Selected ({selectedIds.length})</span>
              </button>
            </div>

          </div>

          {/* Scans list table */}
          <div className="bg-white border border-navy-100 rounded-xl shadow-sm overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <FileSearch className="h-12 w-12 text-navy-200 mb-3" />
                <h3 className="font-bold text-navy-950">No Previous Scans Found</h3>
                <p className="text-xs text-navy-300 mt-1">
                  Initiate standard audits from the dashboard page to populate the history ledger.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-navy-100 bg-navy-50/30 text-[10px] font-bold text-navy-300 uppercase tracking-widest">
                      <th className="p-4 w-12 text-center">Compare</th>
                      <th className="p-4">Target Scanned Target</th>
                      <th className="p-4">Integration Match</th>
                      <th className="p-4">Risk Rating</th>
                      <th className="p-4">Trust Assessment</th>
                      <th className="p-4">Audit Timestamp</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50 text-xs font-semibold text-navy-950">
                    {filteredHistory.map((item) => {
                      const isChecked = selectedIds.includes(item.id);
                      
                      const riskBadgeStyles = {
                        HIGH: 'bg-red-50 text-danger-red',
                        MEDIUM: 'bg-amber-50 text-warning-amber',
                        LOW: 'bg-green-50 text-safety-green',
                      };

                      return (
                        <tr 
                          key={item.id} 
                          className="hover:bg-navy-50/20 transition-colors"
                        >
                          <td className="p-4 text-center">
                            <button 
                              type="button" 
                              aria-label={`Select ${item.url} for comparison`}
                              onClick={() => toggleSelect(item.id)}
                              className="text-navy-300 hover:text-navy-950 transition-colors focus:outline-none"
                            >
                              {isChecked ? (
                                <CheckSquare className="h-4 w-4 text-safety-green mx-auto" />
                              ) : (
                                <Square className="h-4 w-4 mx-auto" />
                              )}
                            </button>
                          </td>
                          <td className="p-4 truncate max-w-xs">{item.url}</td>
                          <td className="p-4">
                            <span className="font-bold flex items-center space-x-1">
                              <Award className="h-4 w-4 text-safety-green shrink-0" />
                              <span>{item.gateways.join(', ') || 'No matches'}</span>
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${riskBadgeStyles[item.riskLevel]}`}>
                              {item.riskScore} {item.riskLevel}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`font-bold ${item.trustStatus === 'Verified' ? 'text-safety-green' : 'text-danger-red'}`}>
                              {item.trustStatus}
                            </span>
                          </td>
                          <td className="p-4 text-navy-300">{new Date(item.timestamp).toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRowClick(item)}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 border border-navy-100 rounded bg-white hover:bg-navy-50 transition-colors cursor-pointer"
                            >
                              <span>View</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Comparison Drawer overlay */}
      {isCompareOpen && selectedItems.length === 2 && (
        <ComparisonDrawer
          itemA={selectedItems[0]}
          itemB={selectedItems[1]}
          onClose={() => { setIsCompareOpen(false); setSelectedIds([]); }}
        />
      )}
    </div>
  );
};
export default History;
