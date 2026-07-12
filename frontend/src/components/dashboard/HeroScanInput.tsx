import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanUrl, scanFile } from '../../services/api';
import { useScanStore } from '../../store/scanStore';
import { Globe, FileCode, Upload, ArrowRight, ShieldAlert } from 'lucide-react';

export const HeroScanInput: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { startScan, setScanResult, setScanningStep, setScanning } = useScanStore();

  const runScanningSimulation = async (callback: () => Promise<any>) => {
    startScan();
    setErrorMsg(null);
    
    // Step 0: Initial setup
    setScanningStep(0);
    
    try {
      // Start timeline simulation alongside API call
      const stepTimer = (step: number, ms: number) => 
        new Promise<void>((resolve) => setTimeout(() => { setScanningStep(step); resolve(); }, ms));
      
      const apiCallPromise = callback();
      
      // Simultaneous timeline steps simulation
      await stepTimer(1, 400); // Fetching Page HTML
      await stepTimer(2, 800); // Parsing DOM elements
      await stepTimer(3, 1200); // Matching gateway signatures
      await stepTimer(4, 1600); // Evaluating security heuristics
      
      const result = await apiCallPromise;
      
      setScanningStep(5); // Complete
      // Small timeout to show completed timeline state
      setTimeout(() => {
        setScanResult(result);
        navigate('/results');
      }, 500);
      
    } catch (e: any) {
      setScanning(false);
      const detail = e.response?.data?.detail || e.message || 'Unknown network error';
      setErrorMsg(`Analysis failed: ${detail}`);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = urlInput.trim();
    if (!target) {
      setErrorMsg('Please specify a scan URL target.');
      return;
    }
    runScanningSimulation(() => scanUrl(target));
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInput) {
      setErrorMsg('Please select an HTML file to upload.');
      return;
    }
    runScanningSimulation(() => scanFile(fileInput));
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-white rounded-2xl border border-navy-100 shadow-xl overflow-hidden">
      {/* Title & Accent */}
      <div className="bg-navy-900 text-white p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Globe className="h-48 w-48 rotate-12" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">Analyze Payment Infrastructure</h2>
        <p className="mt-2 text-navy-200 max-w-lg mx-auto text-sm">
          Audit targets for integrated merchant checkouts, signature presence, or suspicious script manipulation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-navy-100 bg-navy-50/50">
        <button
          onClick={() => { setActiveTab('url'); setErrorMsg(null); }}
          className={`flex-1 py-4 flex items-center justify-center space-x-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'url'
              ? 'border-safety-green text-navy-900 bg-white'
              : 'border-transparent text-navy-300 hover:text-navy-950'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Web URL scan</span>
        </button>
        <button
          onClick={() => { setActiveTab('file'); setErrorMsg(null); }}
          className={`flex-1 py-4 flex items-center justify-center space-x-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'file'
              ? 'border-safety-green text-navy-900 bg-white'
              : 'border-transparent text-navy-300 hover:text-navy-950'
          }`}
        >
          <FileCode className="h-4 w-4" />
          <span>Local HTML File Scan</span>
        </button>
      </div>

      {/* Content Form */}
      <div className="p-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-danger-red rounded-lg flex items-start space-x-3 text-danger-red text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Audit Exception Flagged</p>
              <p className="opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {activeTab === 'url' ? (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-navy-300">
                  <Globe className="h-5 w-5" />
                </div>
                <input
                  id="url-scan-input"
                  aria-label="Web URL target to scan"
                  type="text"
                  placeholder="https://merchant.com/checkout"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-navy-200 rounded-xl bg-navy-50/20 text-navy-950 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-all text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-safety-green hover:bg-safety-green-hover text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-safety-green-bg transition-all shrink-0 cursor-pointer"
              >
                <span>Scan Website</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-navy-300 text-center font-medium">
              Accepts fully qualified HTTP or HTTPS website links containing checkouts.
            </p>
          </form>
        ) : (
          <form onSubmit={handleFileSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-navy-200 rounded-xl p-8 hover:bg-navy-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer relative">
              <input
                id="file-scan-input"
                aria-label="Local HTML file to upload"
                type="file"
                accept=".html,.htm"
                onChange={(e) => setFileInput(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="h-10 w-10 text-navy-300 mb-4" />
              <p className="text-sm font-bold text-navy-950">
                {fileInput ? fileInput.name : 'Select or drag raw HTML file here'}
              </p>
              <p className="text-xs text-navy-300 mt-1">
                {fileInput ? `Size: ${(fileInput.size / 1024).toFixed(1)} KB` : 'Only .html or .htm up to 10MB'}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-safety-green hover:bg-safety-green-hover text-white px-10 py-4 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-safety-green-bg transition-all cursor-pointer"
              >
                <span>Upload & Scan File</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default HeroScanInput;
