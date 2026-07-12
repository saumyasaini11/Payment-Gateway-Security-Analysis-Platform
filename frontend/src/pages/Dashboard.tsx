import React from 'react';
import { useScanStore } from '../store/scanStore';
import HeroScanInput from '../components/dashboard/HeroScanInput';
import ScanProgressTimeline from '../components/timeline/ScanProgressTimeline';
import Navbar from '../components/layout/Navbar';

export const Dashboard: React.FC = () => {
  const { isScanning } = useScanStore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-navy-50/30">
      <Navbar title="Dashboard" />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center py-6">
            <h1 className="text-4xl font-extrabold text-navy-950 tracking-tight">
              Payment Gateway Security Analysis Platform
            </h1>
            <p className="text-navy-300 mt-2 font-medium max-w-xl mx-auto text-sm">
              An enterprise security audit pipeline resolving merchant checkout architectures, integration anomalies, and code threat intelligence.
            </p>
          </div>

          {!isScanning ? (
            <HeroScanInput />
          ) : (
            <ScanProgressTimeline />
          )}
        </div>
      </main>
    </div>
  );
};
export default Dashboard;
