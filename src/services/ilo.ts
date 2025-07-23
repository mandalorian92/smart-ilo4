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

type PidInfo = {
  number: number;
  pgain: number;
  igain: number;
  dgain: number;
  setpoint: number;
  imin: number;
  imax: number;
  lowLimit: number;
  highLimit: number;
  prevDrive: number;
  output: number;
  isActive: boolean; // true if prev_drive > 0 or output > 0
};

let sensorOverrides: Record<string, number> = {};
let fanOverrides: Record<string, number> = {};
// History data structure: store individual sensor readings over time
type SensorHistoryPoint = {
  time: string;
  timestamp: number; // Unix timestamp for proper timezone handling
  sensors: { [sensorName: string]: number }; // Individual sensor readings
};

let history: SensorHistoryPoint[] = [];
let lastThermalData: any = null;
let lastPidData: PidInfo[] = [];

// Cache thermal data for 30 seconds to avoid too many API calls
let lastFetchTime = 0;
let lastPidFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds
const PID_CACHE_DURATION = 300000; // 5 minutes for PID data

// Function to invalidate cache (force refresh on next request)
export function invalidateThermalCache() {
  lastFetchTime = 0;
  lastThermalData = null;
  lastPidFetchTime = 0;
  lastPidData = [];
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

async function getCachedPidData(): Promise<PidInfo[]> {
  const now = Date.now();
  if (lastPidData.length === 0 || (now - lastPidFetchTime) > PID_CACHE_DURATION) {
    try {
      lastPidData = await parsePidInfo();
      lastPidFetchTime = now;
    } catch (error) {
      console.error('Failed to fetch PID data, using cached data if available:', error);
      if (lastPidData.length === 0) {
        throw error;
      }
    }
  }
  return lastPidData;
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

async function parsePidInfo(): Promise<PidInfo[]> {
  try {
    const output = await runIloCommand("fan info a");
    const lines = output.split('\n');
    const pids: PidInfo[] = [];
    
    // Find the header line to get column positions
    let dataStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('No.') && lines[i].includes('prev_drive') && lines[i].includes('output')) {
        dataStartIndex = i + 1;
        break;
      }
    }
    
    if (dataStartIndex === -1) {
      console.warn('Could not find PID data header in fan info output');
      return [];
    }
    
    // Parse each PID line
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || !line.match(/^\d+/)) continue; // Skip non-data lines
      
      // Split by whitespace and parse
      const parts = line.split(/\s+/);
      if (parts.length >= 11) {
        const number = parseInt(parts[0]);
        const pgain = parseFloat(parts[1]);
        const igain = parseFloat(parts[2]);
        const dgain = parseFloat(parts[3]);
        const setpoint = parseFloat(parts[4]);
        const imin = parseFloat(parts[5]);
        const imax = parseFloat(parts[6]);
        const lowLimit = parseFloat(parts[7]);
        const highLimit = parseFloat(parts[8]);
        const prevDrive = parseFloat(parts[9]);
        const output = parseFloat(parts[10]);
        
        const isActive = prevDrive > 0 || output > 0;
        
        pids.push({
          number,
          pgain,
          igain,
          dgain,
          setpoint,
          imin,
          imax,
          lowLimit,
          highLimit,
          prevDrive,
          output,
          isActive
        });
      }
    }
    
    return pids;
  } catch (error) {
    console.error('Failed to parse PID info:', error);
    return [];
  }
}

// Update history every minute with individual sensor readings
setInterval(async () => {
  try {
    const sensors = await getSensors();
    const now = new Date();
    const timestamp = now.getTime();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Store individual sensor readings
    const sensorReadings: { [sensorName: string]: number } = {};
    sensors.forEach(sensor => {
      sensorReadings[sensor.name] = sensor.reading;
    });
    
    history.push({ 
      time, 
      timestamp,
      sensors: sensorReadings 
    });
    
    // Keep only last 60 entries (1 hour of data)
    if (history.length > 60) {
      history = history.slice(-60);
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

export async function getActivePids(): Promise<PidInfo[]> {
  try {
    const pids = await getCachedPidData();
    return pids.filter(pid => pid.isActive);
  } catch (error) {
    console.error('Failed to get active PIDs:', error);
    return [];
  }
}

export async function getAllPids(): Promise<PidInfo[]> {
  try {
    return await getCachedPidData();
  } catch (error) {
    console.error('Failed to get all PIDs:', error);
    return [];
  }
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
