export interface GatewayMatch {
  name: string;
  confidence: 'High' | 'Medium' | 'Low' | 'None';
  score: number;
  matches: string[];
}

export interface ScanStats {
  duration_seconds: number;
  num_scripts_analyzed: number;
  num_forms_analyzed: number;
  num_elements_analyzed: number;
}

export interface TrustAssessment {
  status: 'Verified' | 'Review Recommended' | 'Needs Investigation';
  explanation: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScanResult {
  url: string;
  gateways: GatewayMatch[];
  suspicious: string[];
  statistics: ScanStats;
  trust_assessment: TrustAssessment | null;
}

export interface ScanEnvelope {
  request_id: string;
  scan_result: ScanResult;
}

export interface HealthCheck {
  status: string;
  uptime: number;
  version: string;
  scanner_ready: boolean;
}

export interface VersionInfo {
  version: string;
  scanner_engine: string;
  supported_gateways: string[];
  analysis_mode: string;
  signature_version: string;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp: string;
  gateways: string[];
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  trustStatus: 'Verified' | 'Review Recommended' | 'Needs Investigation';
  envelope: ScanEnvelope;
}
