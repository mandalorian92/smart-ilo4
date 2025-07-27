import { centralizedDataFetcher } from "./centralizedDataFetcher.js";

export interface SystemLogRecord {
  number: number;
  severity: 'Caution' | 'Critical' | 'Informational' | 'OK';
  date: string;
  time: string;
  description: string;
}

export async function getRecentSystemLogs(): Promise<SystemLogRecord[]> {
  try {
    const result = centralizedDataFetcher.getSystemLogs();
    
    if (result.error) {
      console.error('Centralized fetcher error for system logs:', result.error);
      throw new Error(`Failed to get system logs: ${result.error}`);
    }
    
    // For logs, return empty array if no data yet (instead of throwing error)
    if (!result.data || result.data.length === 0) {
      // Check if fetcher is running
      if (!centralizedDataFetcher.isRunning()) {
        console.warn('System logs service is not running. Please check iLO configuration.');
        return [];
      }
      
      // If fetcher is running but no data yet, return empty array
      console.log('System logs are being fetched or no logs available');
      return [];
    }
    
    return result.data;
  } catch (error) {
    console.error('Error getting system logs from centralized fetcher:', error);
    throw error;
  }
}
