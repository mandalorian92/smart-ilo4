import axios from "axios";

// In development, use the backend port; in Docker/production, use same origin
const API_BASE = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8443' : window.location.origin);

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Helper function for GET requests
const get = async (endpoint: string) => {
  const res = await api.get(endpoint);
  return res.data;
};

// Helper function for POST requests
const post = async (endpoint: string, data?: any) => {
  const res = await api.post(endpoint, data);
  return res.data;
};

// Sensor API
export const getSensors = () => get('/sensors');
export const getAvailableSensors = () => get('/sensors/available');
export const getActivePids = () => get('/sensors/active-pids');
export const getAllPids = () => get('/sensors/pids');
export const getHistory = () => get('/sensors/history');
export const overrideSensor = (sensorId: string, value: number) => 
  post('/sensors/override', { sensorId, value });
export const resetSensors = () => post('/sensors/reset');

// Fan API
export const getFans = () => get('/fans');
export const overrideFan = (fanId: string, speed: number) => 
  post('/fans/override', { fanId, speed });
export const setAllFanSpeeds = (speed: number) => post('/fans/set-all', { speed });
export const unlockFanControl = () => post('/fans/unlock');
export const lockFanAtSpeed = (fanId: number, speed: number) => 
  post('/fans/lock', { fanId, speed });
export const setPidLowLimit = (pidId: number, lowLimit: number) => 
  post('/fans/pid-low-limit', { pidId, lowLimit });
export const getFanInfo = () => get('/fans/info');
export const getFanPidInfo = () => get('/fans/pid-info');
export const getFanGroupInfo = () => get('/fans/group-info');
export const setSensorLowLimit = (sensorId: number, lowLimit: number) => 
  post('/sensors/set-low-limit', { sensorId, lowLimit });
export const invalidateFanCache = () => post('/fans/invalidate-cache');

// System Information API
export interface SystemInformation {
  model: string;
  serialNumber: string;
  iloGeneration: string;
  systemRom: string;
  iloFirmware: string;
}

export const getSystemInformation = (): Promise<SystemInformation> => get('/api/system/info');
export const refreshSystemInformation = (): Promise<SystemInformation> => post('/api/system/info/refresh');

// iLO Configuration API
export interface ILoConfig {
  host: string;
  username: string;
  password?: string;
  configured: boolean;
}

export const getILoConfig = (): Promise<ILoConfig> => get('/api/ilo/config');
export const saveILoConfig = (host: string, username: string, password: string): Promise<void> => 
  post('/api/ilo/config', { host, username, password });
export const testILoConnection = (host: string, username: string, password: string): Promise<{ success: boolean; message: string }> => 
  post('/api/ilo/test', { host, username, password });
export const getILoStatus = (): Promise<{ configured: boolean }> => get('/api/ilo/status');

// App Configuration API
export interface AppConfig {
  port: number;
  sessionTimeout: number;
}

export const getAppConfig = (): Promise<AppConfig> => get('/api/app/config');
export const saveAppConfig = (config: AppConfig): Promise<void> => post('/api/app/config', config);
export const restartServerWithConfig = (port?: number): Promise<void> => post('/api/app/restart', { port });