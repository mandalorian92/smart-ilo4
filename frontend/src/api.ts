import axios from "axios";

// In Docker/production, the API is served from the same origin
const API_BASE = process.env.REACT_APP_API_URL || window.location.origin;

export async function getSensors() {
  const res = await axios.get(`${API_BASE}/sensors`);
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

export async function resetFans() {
  const res = await axios.post(`${API_BASE}/fans/reset`);
  return res.data;
}

export async function setAllFanSpeeds(speed: number) {
  const res = await axios.post(`${API_BASE}/fans/set-all`, { speed });
  return res.data;
}