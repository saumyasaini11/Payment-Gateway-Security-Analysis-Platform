import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVersion } from '../services/api';
import Navbar from '../components/layout/Navbar';
import { Cpu, RefreshCw, Layers } from 'lucide-react';

export const System: React.FC = () => {
  const { data: info, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['engine-version'],
    queryFn: getVersion,
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-navy-50/30">
      <Navbar title="Engine Status" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-navy-950">Engine Specifications</h2>
              <p className="text-xs text-navy-300">Technical configurations for scanning algorithms</p>
            </div>
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center space-x-2 px-4 py-2 border border-navy-100 bg-white hover:bg-navy-50 rounded-lg text-xs font-semibold text-navy-800 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Reload Engine Data</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Version Detail List */}
            <div className="bg-white border border-navy-100 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <Cpu className="h-5 w-5 text-safety-green" />
                <h3 className="font-bold text-navy-950">Version Ledger</h3>
              </div>

              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-navy-50 rounded w-1/2" />
                  <div className="h-4 bg-navy-50 rounded w-3/4" />
                  <div className="h-4 bg-navy-50 rounded w-2/3" />
                </div>
              ) : (
                <div className="divide-y divide-navy-50 text-xs font-semibold text-navy-950">
                  <div className="py-3 flex justify-between">
                    <span className="text-navy-300">Platform Version:</span>
                    <span>{info?.version}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-navy-300">Scanner Engine Tech:</span>
                    <span>{info?.scanner_engine}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-navy-300">Analysis Strategy:</span>
                    <span>{info?.analysis_mode}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-navy-300">Signature Hash Path:</span>
                    <span className="font-mono text-[10px] bg-navy-50 px-1 rounded truncate max-w-xs">{info?.signature_version}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-navy-300">Last Synced:</span>
                    <span>{info ? new Date(info.timestamp).toLocaleString() : ''}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Configured signature matches */}
            <div className="bg-white border border-navy-100 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <Layers className="h-5 w-5 text-safety-green" />
                <h3 className="font-bold text-navy-950">Supported Gateways</h3>
              </div>

              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-navy-50 rounded w-1/2" />
                  <div className="h-4 bg-navy-50 rounded w-3/4" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {info?.supported_gateways.map((g) => (
                    <span 
                      key={g} 
                      className="px-3 py-1 bg-navy-50 text-navy-950 font-bold rounded-lg border border-navy-100 text-xs"
                    >
                      {g}
                    </span>
                  )) || <span className="text-xs text-navy-300">No supported configurations loaded.</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default System;
