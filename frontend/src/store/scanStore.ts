import { create } from 'zustand';
import type { ScanEnvelope, HistoryItem } from '../types';

interface ScanState {
  currentScan: ScanEnvelope | null;
  isScanning: boolean;
  scanningStep: number;
  scanHistory: HistoryItem[];
  
  startScan: () => void;
  setScanResult: (result: ScanEnvelope) => void;
  setScanningStep: (step: number) => void;
  setScanning: (status: boolean) => void;
  clearScan: () => void;
}

// Load scan history from local storage if available
const loadHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem('payment_gateway_scan_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history: HistoryItem[]) => {
  try {
    localStorage.setItem('payment_gateway_scan_history', JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save scan history:', e);
  }
};

// Calculate Risk Score and Level based on scan_result heuristics
export const calculateRisk = (envelope: ScanEnvelope) => {
  const result = envelope.scan_result;

  // If the API already computed a trust assessment, use it directly
  if (result.trust_assessment) {
    return {
      score: result.trust_assessment.risk_score,
      level: result.trust_assessment.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
      trustStatus: result.trust_assessment.status as 'Verified' | 'Review Recommended' | 'Needs Investigation',
    };
  }

  // Fallback: derive locally from suspicious findings count if trust_assessment is absent
  let score = result.suspicious.length * 25;
  score = Math.min(score, 100);

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score >= 75) level = 'HIGH';
  else if (score >= 50) level = 'MEDIUM';

  const trustStatus: 'Verified' | 'Needs Investigation' = result.suspicious.length > 0 ? 'Needs Investigation' : 'Verified';

  return { score, level, trustStatus };
};

export const useScanStore = create<ScanState>((set) => ({
  currentScan: null,
  isScanning: false,
  scanningStep: 0,
  scanHistory: loadHistory(),
  
  startScan: () => {
    set({ isScanning: true, currentScan: null, scanningStep: 0 });
  },
  
  setScanResult: (result: ScanEnvelope) => {
    const { score, level, trustStatus } = calculateRisk(result);
    const newItem: HistoryItem = {
      id: result.request_id,
      url: result.scan_result.url,
      timestamp: new Date().toISOString(),
      gateways: result.scan_result.gateways.map((g) => g.name),
      riskScore: score,
      riskLevel: level,
      trustStatus,
      envelope: result,
    };
    
    set((state) => {
      const updatedHistory = [newItem, ...state.scanHistory].slice(0, 50); // limit to 50 items
      saveHistory(updatedHistory);
      return {
        currentScan: result,
        isScanning: false,
        scanningStep: 5,
        scanHistory: updatedHistory,
      };
    });
  },
  
  setScanningStep: (step: number) => set({ scanningStep: step }),
  setScanning: (status: boolean) => set({ isScanning: status }),
  clearScan: () => set({ currentScan: null, scanningStep: 0, isScanning: false }),
}));
