import { runIloCommand } from "./sshClient.js";

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

class PowerInfoCache {
  private static instance: PowerInfoCache;
  private cachedInfo: PowerInformation | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 1000; // 5 seconds for power data (more frequent than system info)
  private fetchPromise: Promise<PowerInformation> | null = null;

  private constructor() {}

  public static getInstance(): PowerInfoCache {
    if (!PowerInfoCache.instance) {
      PowerInfoCache.instance = new PowerInfoCache();
    }
    return PowerInfoCache.instance;
  }

  public async getPowerInfo(): Promise<PowerInformation> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cachedInfo && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedInfo;
    }

    // If already fetching, return the existing promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start new fetch
    this.fetchPromise = this.fetchPowerInfo();
    
    try {
      this.cachedInfo = await this.fetchPromise;
      this.lastFetchTime = now;
      return this.cachedInfo;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async fetchPowerInfo(): Promise<PowerInformation> {
    console.log("Fetching power information from iLO...");
    
    try {
      const [powerOutput] = await Promise.all([
        runIloCommand('show /system1/oemhp_power1')
      ]);

      // Parse power information
      const parseProperty = (output: string, property: string): string => {
        const regex = new RegExp(`${property}=(.+)`);
        const match = output.match(regex);
        return match ? match[1].trim() : '';
      };

      const parseNumericProperty = (output: string, property: string): number => {
        const value = parseProperty(output, property);
        const numMatch = value.match(/(\d+(?:\.\d+)?)/);
        return numMatch ? parseFloat(numMatch[1]) : 0;
      };

      const powerInfo: PowerInformation = {
        powerRegulation: parseProperty(powerOutput, 'oemhp_powerreg'),
        powerCap: parseNumericProperty(powerOutput, 'oemhp_pwrcap'),
        presentPower: parseNumericProperty(powerOutput, 'oemhp_PresentPower'),
        averagePower: parseNumericProperty(powerOutput, 'oemhp_AvgPower'),
        maxPower: parseNumericProperty(powerOutput, 'oemhp_MaxPower'),
        minPower: parseNumericProperty(powerOutput, 'oemhp_MinPower'),
        powerSupplyCapacity: parseNumericProperty(powerOutput, 'oemhp_powersupplycapacity'),
        serverMaxPower: parseNumericProperty(powerOutput, 'oemhp_servermaxpower'),
        serverMinPower: parseNumericProperty(powerOutput, 'oemhp_serverminpower'),
        warningType: parseProperty(powerOutput, 'warning_type'),
        warningThreshold: parseNumericProperty(powerOutput, 'warning_threshold'),
        warningDuration: parseNumericProperty(powerOutput, 'warning_duration'),
        powerMicroVersion: parseProperty(powerOutput, 'oemhp_power_micro_ver'),
        autoPowerRestore: parseProperty(powerOutput, 'oemhp_auto_pwr')
      };

      console.log("Power information fetched successfully:", powerInfo);
      return powerInfo;
    } catch (error) {
      console.error("Error fetching power information:", error);
      throw error;
    }
  }

  public invalidateCache(): void {
    this.cachedInfo = null;
    this.lastFetchTime = 0;
  }
}

// Create singleton instance
const powerInfoCache = PowerInfoCache.getInstance();

// Convenience function for getting power info
export async function getPowerInformation(): Promise<PowerInformation> {
  return powerInfoCache.getPowerInfo();
}

// Convenience function for refreshing power info
export async function refreshPowerInformation(): Promise<PowerInformation> {
  powerInfoCache.invalidateCache();
  return powerInfoCache.getPowerInfo();
}
