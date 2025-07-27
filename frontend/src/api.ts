import axios from "axios";

// In development, use the backend port; in Docker/production, use same origin
const API_BASE = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8443' : window.location.origin);

// Create axios instance with common configuration
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // Increased to 30 seconds to allow backend time to fetch data
});

// Simple cache implementation for performance optimization
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = {
  sensors: 3 * 60 * 1000,      // 3 minutes to match backend
  fans: 3 * 60 * 1000,         // 3 minutes
  systemInfo: 3 * 60 * 1000,   // 3 minutes to match backend
  power: 3 * 60 * 1000,        // 3 minutes to match backend
  history: 60000       // 1 minute
};

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// Cache invalidation function
export const invalidateCache = (keys?: string[]): void => {
  if (keys) {
    keys.forEach(key => cache.delete(key));
  } else {
    cache.clear();
  }
};

// Helper function for GET requests with caching and optional AbortSignal
const get = async (endpoint: string, cacheKey?: string, ttl?: number, options?: { signal?: AbortSignal }) => {
  if (cacheKey && ttl) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }
  }
  const config = options && options.signal ? { signal: options.signal } : {};
  const res = await api.get(endpoint, config);
  if (cacheKey && ttl) {
    setCachedData(cacheKey, res.data, ttl);
  }
  return res.data;
};

// Helper function for POST requests with optional timeout override
const post = async (endpoint: string, data?: any, timeout?: number) => {
  const config = timeout ? { timeout } : {};
  const res = await api.post(endpoint, data, config);
  return res.data;
};

// Sensor API (with caching optimization)
export const getSensors = () => get('/sensors', 'sensors', CACHE_TTL.sensors);
export const getAvailableSensors = () => get('/sensors/available');
export const getActivePids = () => get('/sensors/active-pids');
export const getAllPids = () => get('/sensors/pids');
export const getHistory = () => get('/sensors/history', 'history', CACHE_TTL.history);
export const overrideSensor = (sensorId: string, value: number) => {
  invalidateCache(['sensors']);
  return post('/sensors/override', { sensorId, value });
};
export const resetSensors = () => {
  invalidateCache(['sensors']);
  return post('/sensors/reset');
};

// Fan API (with caching optimization and extended timeouts for SSH operations)
export const getFans = () => get('/fans', 'fans', CACHE_TTL.fans);
export const overrideFan = (fanId: string, speed: number) => {
  invalidateCache(['fans']);
  return post('/fans/override', { fanId, speed }, 30000); // 30 second timeout for fan operations
};
export const setAllFanSpeeds = (speed: number) => {
  invalidateCache(['fans']);
  return post('/fans/set-all', { speed }, 30000); // 30 second timeout for fan operations
};
export const unlockFanControl = () => {
  invalidateCache(['fans']);
  return post('/fans/unlock', undefined, 30000); // 30 second timeout for SSH operations
};
export const lockFanAtSpeed = (fanId: number, speed: number) => {
  invalidateCache(['fans']);
  return post('/fans/lock', { fanId, speed }, 30000); // 30 second timeout for fan operations
};
export const setPidLowLimit = (pidId: number, lowLimit: number) => 
  post('/fans/pid-low-limit', { pidId, lowLimit });
export const getFanInfo = () => get('/fans/info');
export const getFanPidInfo = () => get('/fans/pid-info');
export const getFanGroupInfo = () => get('/fans/group-info');
export const setSensorLowLimit = (sensorId: number, lowLimit: number) => 
  post('/sensors/set-low-limit', { sensorId, lowLimit });
export const invalidateFanCache = () => {
  invalidateCache(['fans']);
  return post('/fans/invalidate-cache', undefined, 15000); // 15 second timeout
};

// System Information API
export interface SystemInformation {
  model: string;
  serialNumber: string;
  iloGeneration: string;
  systemRom: string;
  iloFirmware: string;
}

export const getSystemInformation = (): Promise<SystemInformation> => 
  get('/api/system/info', 'systemInfo', CACHE_TTL.systemInfo);
export const refreshSystemInformation = (): Promise<SystemInformation> => {
  invalidateCache(['systemInfo']);
  return post('/api/system/info/refresh');
};

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

// Auth API for admin setup
export const setupAdminPassword = async (username: string, password: string, tempPassword?: string): Promise<{ success: boolean; message: string }> => 
  post('/api/auth/setup-admin', { username, password, tempPassword });

// Power Monitoring API
export interface PowerInformation {
  powerRegulation: string;
  powerCap: number;
  presentPower: number;
  averagePower: number;
  maxPower: number;
  minPower: number;
  powerSupplyCapacity: number;
  serverMaxPower: number;
  serverMinPower: number;
  warningType: string;
  warningThreshold: number;
  warningDuration: number;
  powerMicroVersion: string;
  autoPowerRestore: string;
}

export interface SystemLogRecord {
  number: number;
  severity: 'Caution' | 'Critical' | 'Informational' | 'OK';
  date: string;
  time: string;
  description: string;
}

export const getPowerInformation = (): Promise<PowerInformation> => 
  get('/api/power/info', 'power', CACHE_TTL.power);
export const refreshPowerInformation = (): Promise<PowerInformation> => {
  invalidateCache(['power']);
  return post('/api/power/refresh');
};

export const getRecentSystemLogs = (options?: { signal?: AbortSignal }): Promise<SystemLogRecord[]> => 
  get('/api/systemlog/recent', 'systemlogs', 30000, options); // 30 second cache