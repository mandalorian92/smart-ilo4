// This file holds the logic for sensors, fans, overrides, and history collection.
import { getThermalData } from "./redfish.js";
import { runIloCommand } from "./sshClient.js";

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

// Function to invalidate cache (force refresh on next request)
export function invalidateThermalCache() {
  lastFetchTime = 0;
  lastThermalData = null;
}

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
  try {
    // Use SSH commands to set all fans via global unlock and lock
    await unlockFanControl();
    
    // Get current fans and lock each one at the specified speed
    const fans = await getFans();
    for (let i = 0; i < fans.length; i++) {
      await lockFanAtSpeed(i, speed);
    }
    
    // Invalidate cache to force fresh data on next request
    invalidateThermalCache();
  } catch (error) {
    console.error(`Failed to set all fans to ${speed}%:`, error);
    // Fallback to override system
    const fans = await getFans();
    fans.forEach(fan => {
      fanOverrides[fan.name] = speed;
    });
  }
}

// SSH-based fan control functions for iLO4
export async function unlockFanControl(): Promise<void> {
  try {
    await runIloCommand("fan p global unlock");
  } catch (error) {
    throw new Error(`Failed to unlock fan control: ${(error as Error).message}`);
  }
}

export async function lockFanAtSpeed(fanId: number, speedPercent: number): Promise<void> {
  try {
    // Convert percentage (10-100%) to PWM value (25-255)
    // Formula: PWM = ((speedPercent / 100) * 255) but with minimum of 25
    const pwmValue = Math.max(25, Math.round((speedPercent / 100) * 255));
    await runIloCommand(`fan p ${fanId} lock ${pwmValue}`);
    
    // Invalidate cache to force fresh data on next request
    invalidateThermalCache();
  } catch (error) {
    throw new Error(`Failed to lock fan ${fanId} at ${speedPercent}%: ${(error as Error).message}`);
  }
}

export async function setPidLowLimit(pidId: number, lowLimitPercent: number): Promise<void> {
  try {
    // iLO expects the value multiplied by 100
    const iloValue = lowLimitPercent * 100;
    await runIloCommand(`fan pid ${pidId} lo ${iloValue}`);
  } catch (error) {
    throw new Error(`Failed to set PID ${pidId} low limit to ${lowLimitPercent}%: ${(error as Error).message}`);
  }
}

export async function getFanInfo(): Promise<string> {
  try {
    return await runIloCommand("fan info");
  } catch (error) {
    throw new Error(`Failed to get fan info: ${(error as Error).message}`);
  }
}

export async function getFanPidInfo(): Promise<string> {
  try {
    return await runIloCommand("fan info a");
  } catch (error) {
    throw new Error(`Failed to get PID info: ${(error as Error).message}`);
  }
}

export async function getFanGroupInfo(): Promise<string> {
  try {
    return await runIloCommand("fan info g");
  } catch (error) {
    throw new Error(`Failed to get fan group info: ${(error as Error).message}`);
  }
}
