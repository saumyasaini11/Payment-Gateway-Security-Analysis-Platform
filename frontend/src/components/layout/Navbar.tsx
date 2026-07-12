import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../../services/api';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: getHealth,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return (
    <header className="h-16 border-b border-navy-100 bg-white px-8 flex items-center justify-between shadow-sm">
      <h2 className="text-xl font-bold text-navy-950">{title}</h2>
      
      <div className="flex items-center space-x-6">
        {/* Health Probe Tag */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-navy-300 font-semibold uppercase text-xs tracking-wider">Engine Status:</span>
          {isLoading ? (
            <div className="flex items-center space-x-1 text-amber-500 font-medium animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : health?.scanner_ready ? (
            <div className="flex items-center space-x-1 text-safety-green font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Signatures Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-danger-red font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>Offline / Unready</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-navy-300 hover:text-navy-950 hover:bg-navy-50 rounded-lg transition-colors"
          title="Refresh Engine State"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
export default Navbar;
