import axios from "axios";

// In development, use the backend port; in Docker/production, use same origin
const API_BASE = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8443' : window.location.origin);

export async function getSensors() {
  const res = await axios.get(`${API_BASE}/sensors`);
  return res.data;
}

export async function getAvailableSensors() {
  const res = await axios.get(`${API_BASE}/sensors/available`);
  return res.data;
}

export async function getActivePids() {
  const res = await axios.get(`${API_BASE}/sensors/active-pids`);
  return res.data;
}

export async function getAllPids() {
  const res = await axios.get(`${API_BASE}/sensors/pids`);
  return res.data;
}

export async function getFans() {
  const res = await axios.get(`${API_BASE}/fans`);
  return res.data;
}

export async function getHistory() {
  const res = await axios.get(`${API_BASE}/sensors/history`);
  return res.data;
}

export async function overrideSensor(sensorId: string, value: number) {
  const res = await axios.post(`${API_BASE}/sensors/override`, { sensorId, value });
  return res.data;
}

export async function resetSensors() {
  const res = await axios.post(`${API_BASE}/sensors/reset`);
  return res.data;
}

export async function overrideFan(fanId: string, speed: number) {
  const res = await axios.post(`${API_BASE}/fans/override`, { fanId, speed });
  return res.data;
}

export async function setAllFanSpeeds(speed: number) {
  const res = await axios.post(`${API_BASE}/fans/set-all`, { speed });
  return res.data;
}

export async function unlockFanControl() {
  const res = await axios.post(`${API_BASE}/fans/unlock`);
  return res.data;
}

export async function lockFanAtSpeed(fanId: number, speed: number) {
  const res = await axios.post(`${API_BASE}/fans/lock`, { fanId, speed });
  return res.data;
}

export async function setPidLowLimit(pidId: number, lowLimit: number) {
  const res = await axios.post(`${API_BASE}/fans/pid-low-limit`, { pidId, lowLimit });
  return res.data;
}

export async function getFanInfo() {
  const res = await axios.get(`${API_BASE}/fans/info`);
  return res.data;
}

export async function getFanPidInfo() {
  const res = await axios.get(`${API_BASE}/fans/pid-info`);
  return res.data;
}

export async function getFanGroupInfo() {
  const res = await axios.get(`${API_BASE}/fans/group-info`);
  return res.data;
}

export async function setSensorLowLimit(sensorId: number, lowLimit: number) {
  const res = await axios.post(`${API_BASE}/sensors/set-low-limit`, { sensorId, lowLimit });
  return res.data;
}

export async function invalidateFanCache() {
  const res = await axios.post(`${API_BASE}/fans/invalidate-cache`);
  return res.data;
}

// System Information API
export interface SystemInformation {
  model: string;
  serialNumber: string;
  iloGeneration: string;
  systemRom: string;
  iloFirmware: string;
}

export async function getSystemInformation(): Promise<SystemInformation> {
  const res = await axios.get(`${API_BASE}/api/system/info`);
  return res.data;
}

export async function refreshSystemInformation(): Promise<SystemInformation> {
  const res = await axios.post(`${API_BASE}/api/system/info/refresh`);
  return res.data;
}

// iLO Configuration API
export interface ILoConfig {
  host: string;
  username: string;
  password?: string;
  configured: boolean;
}

export async function getILoConfig(): Promise<ILoConfig> {
  const res = await axios.get(`${API_BASE}/api/ilo/config`);
  return res.data;
}

export async function saveILoConfig(host: string, username: string, password: string): Promise<void> {
  const res = await axios.post(`${API_BASE}/api/ilo/config`, { host, username, password });
  return res.data;
}

export async function testILoConnection(host: string, username: string, password: string): Promise<{ success: boolean; message: string }> {
  const res = await axios.post(`${API_BASE}/api/ilo/test`, { host, username, password });
  return res.data;
}

export async function getILoStatus(): Promise<{ configured: boolean }> {
  const res = await axios.get(`${API_BASE}/api/ilo/status`);
  return res.data;
}

// App Configuration API
export interface AppConfig {
  port: number;
  sessionTimeout: number;
}

export async function getAppConfig(): Promise<AppConfig> {
  const res = await axios.get(`${API_BASE}/api/app/config`);
  return res.data;
}

export async function saveAppConfig(config: AppConfig): Promise<void> {
  const res = await axios.post(`${API_BASE}/api/app/config`, config);
  return res.data;
}

export async function restartServerWithConfig(port?: number): Promise<void> {
  const res = await axios.post(`${API_BASE}/api/app/restart`, { port });
  return res.data;
}