// This file holds the logic for sensors, fans, overrides, and history collection.
import { getThermalData } from "./redfish.js";

type Sensor = {
  name: string;
  type: string;
  status: string;
  reading: number;
  context?: string;
  critical?: number;
  fatal?: number;
};

type Fan = {
  name: string;
  speed: number;
  status: string;
  health?: string;
};

let sensorOverrides: Record<string, number> = {};
let fanOverrides: Record<string, number> = {};
let history: { time: string; avgTemp: number }[] = [];
let lastThermalData: any = null;

// Cache thermal data for 30 seconds to avoid too many API calls
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function getCachedThermalData() {
  const now = Date.now();
  if (!lastThermalData || (now - lastFetchTime) > CACHE_DURATION) {
    try {
      lastThermalData = await getThermalData();
      lastFetchTime = now;
    } catch (error) {
      console.error('Failed to fetch thermal data, using cached data if available:', error);
      if (!lastThermalData) {
        throw error;
      }
    }
  }
  return lastThermalData;
}

async function parseSensorsFromThermal(thermalData: any): Promise<Sensor[]> {
  const sensors: Sensor[] = [];
  
  if (thermalData.Temperatures) {
    thermalData.Temperatures.forEach((temp: any) => {
      // Only include enabled sensors with valid readings
      if (temp.Status.State === 'Enabled' && temp.ReadingCelsius !== undefined) {
        sensors.push({
          name: temp.Name,
          type: 'temperature',
          status: temp.Status.Health || 'Unknown',
          reading: temp.ReadingCelsius,
          context: temp.PhysicalContext,
          critical: temp.UpperThresholdCritical,
          fatal: temp.UpperThresholdFatal
        });
      }
    });
  }
  
  return sensors;
}

async function parseFansFromThermal(thermalData: any): Promise<Fan[]> {
  const fans: Fan[] = [];
  
  if (thermalData.Fans) {
    thermalData.Fans.forEach((fan: any) => {
      // Only include fans that are present (not absent)
      if (fan.Status.State !== 'Absent') {
        fans.push({
          name: fan.FanName,
          speed: fan.CurrentReading,
          status: fan.Status.State,
          health: fan.Status.Health
        });
      }
    });
  }
  
  return fans;
}

// Update history every minute with average CPU temperature
setInterval(async () => {
  try {
    const sensors = await getSensors();
    const cpuSensors = sensors.filter(s => 
      s.context === 'CPU' || s.name.toLowerCase().includes('cpu')
    );
    
    if (cpuSensors.length > 0) {
      const avgCpuTemp = cpuSensors.reduce((sum, sensor) => sum + sensor.reading, 0) / cpuSensors.length;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      history.push({ time, avgTemp: avgCpuTemp });
      
      // Keep only last 60 entries (1 hour of data)
      if (history.length > 60) {
        history = history.slice(-60);
      }
    }
  } catch (error) {
    console.error('Failed to update history:', error);
  }
}, 60000);

export async function getSensors(): Promise<Sensor[]> {
  try {
    const thermalData = await getCachedThermalData();
    const sensors = await parseSensorsFromThermal(thermalData);
    
    // Apply overrides
    return sensors.map(s => ({
      ...s,
      reading: sensorOverrides[s.name] ?? s.reading
    }));
  } catch (error) {
    console.error('Failed to get sensors:', error);
    return [];
  }
}

export async function getFans(): Promise<Fan[]> {
  try {
    const thermalData = await getCachedThermalData();
    const fans = await parseFansFromThermal(thermalData);
    
    // Apply overrides
    return fans.map(f => ({
      ...f,
      speed: fanOverrides[f.name] ?? f.speed
    }));
  } catch (error) {
    console.error('Failed to get fans:', error);
    return [];
  }
}

export function overrideSensor(sensorId: string, value: number) {
  sensorOverrides[sensorId] = value;
}

export function overrideFan(fanId: string, speed: number) {
  fanOverrides[fanId] = speed;
}

export function resetSensorOverrides() {
  sensorOverrides = {};
}

export function resetFanOverrides() {
  fanOverrides = {};
}

export function getSensorHistory() {
  return history;
}

export async function setFanSpeed(speed: number) {
  // This will be implemented with SSH commands to iLO
  console.log(`Setting all fans to ${speed}%`);
  const fans = await getFans();
  fans.forEach(fan => {
    fanOverrides[fan.name] = speed;
  });
}
