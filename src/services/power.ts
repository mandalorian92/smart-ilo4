import { centralizedDataFetcher } from "./centralizedDataFetcher.js";

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

// Convenience functions for getting power info from centralized fetcher
export async function getPowerInformation(): Promise<PowerInformation> {
  const result = centralizedDataFetcher.getPowerInfo();
  
  if (result.error) {
    console.error('Centralized fetcher error for power info:', result.error);
    throw new Error(`Failed to get power information: ${result.error}`);
  }
  
  if (!result.data) {
    // Check if fetcher is running and give more helpful error
    if (!centralizedDataFetcher.isRunning()) {
      throw new Error('Power information service is not running. Please check iLO configuration.');
    }
    
    // If fetcher is running but no data yet, it might still be fetching
    const lastUpdated = result.lastUpdated.getTime();
    const now = new Date().getTime();
    
    if (now - lastUpdated < 30000) { // Less than 30 seconds old
      throw new Error('Power information is being fetched. Please try again in a moment.');
    } else {
      throw new Error('No power information available. Please check iLO connection.');
    }
  }
  
  return result.data;
}

// Convenience function for refreshing power info
export async function refreshPowerInformation(): Promise<PowerInformation> {
  await centralizedDataFetcher.refresh();
  return getPowerInformation();
}
