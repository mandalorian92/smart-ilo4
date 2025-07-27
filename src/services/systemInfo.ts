import { centralizedDataFetcher } from "./centralizedDataFetcher.js";

export interface SystemInformation {
  model: string;
  serialNumber: string;
  iloGeneration: string;
  systemRom: string;
  iloFirmware: string;
}

// Convenience function for getting system info from centralized fetcher
export async function getSystemInformation(): Promise<SystemInformation> {
  const result = centralizedDataFetcher.getSystemInfo();
  
  if (result.error) {
    console.error('Centralized fetcher error for system info:', result.error);
    throw new Error(`Failed to get system information: ${result.error}`);
  }
  
  if (!result.data) {
    // Check if fetcher is running and give more helpful error
    if (!centralizedDataFetcher.isRunning()) {
      throw new Error('System information service is not running. Please check iLO configuration.');
    }
    
    // If fetcher is running but no data yet, it might still be fetching
    const lastUpdated = result.lastUpdated.getTime();
    const now = new Date().getTime();
    
    if (now - lastUpdated < 30000) { // Less than 30 seconds old
      throw new Error('System information is being fetched. Please try again in a moment.');
    } else {
      throw new Error('No system information available. Please check iLO connection.');
    }
  }
  
  return result.data;
}

// Initialize system info cache on module load only if iLO is already configured
import { isILoConfigured } from './config.js';

(async () => {
  try {
    const configured = await isILoConfigured();
    if (configured) {
      console.log("iLO is already configured, system will use centralized data fetcher...");
      // The centralized fetcher will handle the background fetching
    } else {
      console.log("iLO not yet configured, system information will be available after setup completion");
    }
  } catch (error) {
    console.error("Error checking iLO configuration status:", error);
  }
})();
