import axios from "axios";

// In Docker/production, the API is served from the same origin
const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

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