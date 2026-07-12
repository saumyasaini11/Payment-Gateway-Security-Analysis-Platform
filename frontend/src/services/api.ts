import axios from 'axios';
import type { ScanEnvelope, HealthCheck, VersionInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const scanUrl = async (url: string): Promise<ScanEnvelope> => {
  const response = await client.post<ScanEnvelope>('/scan', { url });
  return response.data;
};

export const scanFile = async (file: File): Promise<ScanEnvelope> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await client.post<ScanEnvelope>('/scan-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getGateways = async (): Promise<string[]> => {
  const response = await client.get<{ supported_gateways: string[] }>('/gateways');
  return response.data.supported_gateways;
};

export const getHealth = async (): Promise<HealthCheck> => {
  const response = await client.get<HealthCheck>('/health');
  return response.data;
};

export const getVersion = async (): Promise<VersionInfo> => {
  const response = await client.get<VersionInfo>('/version');
  return response.data;
};
