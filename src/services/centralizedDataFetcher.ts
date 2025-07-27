import { runIloCommand } from "./sshClient.js";
import { SystemLogRecord } from "./systemLog.js";
import { PowerInformation } from "./power.js";
import { SystemInformation } from "./systemInfo.js";

interface PidInfo {
  number: number;
  isActive: boolean;
  setPoint: number;
  currentReading: number;
  output: number;
}

interface CachedData {
  systemLogs: SystemLogRecord[];
  powerInfo: PowerInformation | null;
  systemInfo: SystemInformation | null;
  pidData: PidInfo[];
  lastUpdated: Date;
  lastRecordNumbers: number[]; // Track record numbers for smart caching
  cachedLogData: Map<number, SystemLogRecord>; // Cache individual log records
  errors: {
    systemLogs?: string;
    powerInfo?: string;
    systemInfo?: string;
    pidData?: string;
  };
}

class CentralizedDataFetcher {
  private cache: CachedData = {
    systemLogs: [],
    powerInfo: null,
    systemInfo: null,
    pidData: [],
    lastUpdated: new Date(0),
    lastRecordNumbers: [],
    cachedLogData: new Map(),
    errors: {}
  };
  
  private fetchInterval: NodeJS.Timeout | null = null;
  private isFetching = false;
  private isStarted = false;
  private readonly FETCH_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

  constructor() {
    console.log('CentralizedDataFetcher initialized');
  }

  start() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
    }

    this.isStarted = true;
    console.log('CentralizedDataFetcher starting...');
    
    // Fetch immediately, then every 3 minutes
    this.fetchAllData();
    this.fetchInterval = setInterval(() => {
      this.fetchAllData();
    }, this.FETCH_INTERVAL_MS);

    console.log('CentralizedDataFetcher started - fetching every 3 minutes');
  }

  stop() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
    this.isStarted = false;
    console.log('CentralizedDataFetcher stopped');
  }

  isRunning(): boolean {
    return this.isStarted && this.fetchInterval !== null;
  }

  private async fetchAllData() {
    if (this.isFetching) {
      console.log('Already fetching data, skipping this cycle');
      return;
    }

    this.isFetching = true;
    console.log('Starting centralized data fetch cycle...');

    try {
      // Reset errors
      this.cache.errors = {};

      // Check if iLO is configured before attempting to fetch
      const { isILoConfigured } = await import('./config.js');
      const configured = await isILoConfigured();
      
      if (!configured) {
        console.log('iLO not configured, skipping data fetch');
        this.isFetching = false;
        return;
      }

      console.log('iLO is configured, proceeding with data fetch...');

      // Fetch all data in sequence to avoid overwhelming iLO
      // Add delays between fetches to be even more gentle on the SSH connection
      await this.fetchSystemInfo();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      await this.fetchPowerInfo();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      await this.fetchSystemLogs();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      await this.fetchPidData();

      this.cache.lastUpdated = new Date();
      console.log('Centralized data fetch cycle completed successfully');
    } catch (error) {
      console.error('Error in centralized data fetch cycle:', error);
    } finally {
      this.isFetching = false;
    }
  }

  private async fetchSystemLogs() {
    try {
      console.log('Fetching system logs...');
      
      // Get the list of log records
      const logListOutput = await runIloCommand("show system1/log1");
      const recordNumbers = this.extractRecordNumbers(logListOutput);
      
      if (recordNumbers.length === 0) {
        console.warn('No log records found in system log');
        this.cache.systemLogs = [];
        this.cache.lastRecordNumbers = [];
        return;
      }
      
      // Get the last 5 records (increased from 3 for better data)
      const recentRecords = recordNumbers.slice(-5);
      
      // Smart caching: check if record numbers have changed
      const recordsChanged = !this.arraysEqual(recentRecords, this.cache.lastRecordNumbers);
      
      if (!recordsChanged) {
        console.log('Log record numbers unchanged, using cached data');
        return; // No need to fetch, data hasn't changed
      }
      
      console.log(`Log records changed from [${this.cache.lastRecordNumbers.join(', ')}] to [${recentRecords.join(', ')}]`);
      
      // Determine which records are new and need fetching
      const cachedRecords = new Set(this.cache.lastRecordNumbers);
      const newRecords = recentRecords.filter(num => !cachedRecords.has(num));
      
      console.log(`Found ${newRecords.length} new records to fetch: [${newRecords.join(', ')}]`);
      
      // Fetch only new records
      const logRecords: SystemLogRecord[] = [];
      
      for (const recordNumber of recentRecords) {
        try {
          let record: SystemLogRecord | null = null;
          
          if (newRecords.includes(recordNumber)) {
            // Fetch new record from iLO
            console.log(`Fetching new record ${recordNumber}...`);
            const recordOutput = await runIloCommand(`show system1/log1/record${recordNumber}`);
            record = this.parseLogRecord(recordOutput, recordNumber);
            
            if (record) {
              // Cache the new record
              this.cache.cachedLogData.set(recordNumber, record);
            }
            
            // Small delay between records to avoid overwhelming iLO
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            // Use cached record
            record = this.cache.cachedLogData.get(recordNumber) || null;
            if (record) {
              console.log(`Using cached record ${recordNumber}`);
            }
          }
          
          if (record) {
            logRecords.push(record);
          }
        } catch (error) {
          console.error(`Failed to fetch record ${recordNumber}:`, error);
          // Continue with other records
        }
      }
      
      // Clean up old cached records that are no longer in the recent 5
      const recentRecordsSet = new Set(recentRecords);
      for (const [cachedRecordNum] of this.cache.cachedLogData) {
        if (!recentRecordsSet.has(cachedRecordNum)) {
          this.cache.cachedLogData.delete(cachedRecordNum);
          console.log(`Removed old cached record ${cachedRecordNum}`);
        }
      }
      
      // Sort by date/time (most recent first)
      const sortedRecords = logRecords.sort((a, b) => {
        try {
          const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
          const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
          return dateTimeB - dateTimeA;
        } catch {
          return 0;
        }
      });
      
      this.cache.systemLogs = sortedRecords;
      this.cache.lastRecordNumbers = recentRecords; // Update the tracked record numbers
      console.log(`Successfully processed ${sortedRecords.length} system log records (${newRecords.length} newly fetched, ${sortedRecords.length - newRecords.length} from cache)`);
      
    } catch (error) {
      console.error('Error fetching system logs:', error);
      this.cache.errors.systemLogs = error instanceof Error ? error.message : 'Unknown error';
      this.cache.systemLogs = [];
      this.cache.lastRecordNumbers = [];
    }
  }

  private async fetchPowerInfo() {
    try {
      console.log('Fetching power information...');
      
      // Add retry logic for SSH connection issues
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          const powerOutput = await runIloCommand("show /system1/oemhp_power1");
          const powerInfo = this.parsePowerInfo(powerOutput);
          
          this.cache.powerInfo = powerInfo;
          console.log('Successfully fetched power information');
          return;
        } catch (error: any) {
          retries++;
          if (retries > maxRetries) {
            throw error;
          }
          
          // If it's a connection reset, wait before retrying
          if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
            console.log(`SSH connection reset, retrying power fetch (${retries}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          } else {
            throw error; // Don't retry for other types of errors
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching power info:', error);
      this.cache.errors.powerInfo = error instanceof Error ? error.message : 'Unknown error';
      this.cache.powerInfo = null;
    }
  }

  private async fetchSystemInfo() {
    try {
      console.log('Fetching system information...');
      
      // Fetch all required information (same as original systemInfo service)
      const [system1Output, firmware1Output, systemFirmware1Output] = await Promise.all([
        runIloCommand("show system1"),
        runIloCommand("show /map1/firmware1"),
        runIloCommand("show system1/firmware1")
      ]);
      
      const systemInfo = this.parseSystemInfo(system1Output, firmware1Output, systemFirmware1Output);
      
      this.cache.systemInfo = systemInfo;
      console.log('Successfully fetched system information');
      
    } catch (error) {
      console.error('Error fetching system info:', error);
      this.cache.errors.systemInfo = error instanceof Error ? error.message : 'Unknown error';
      this.cache.systemInfo = null;
    }
  }

  private async fetchPidData() {
    try {
      console.log('Fetching PID data...');
      
      const pidOutput = await runIloCommand("fan info a");
      const pidData = this.parsePidInfo(pidOutput);
      
      this.cache.pidData = pidData;
      console.log(`Successfully fetched ${pidData.length} PID entries`);
      
    } catch (error) {
      console.error('Error fetching PID data:', error);
      this.cache.errors.pidData = error instanceof Error ? error.message : 'Unknown error';
      this.cache.pidData = [];
    }
  }

  // Public methods to get cached data
  getSystemLogs(): { data: SystemLogRecord[]; error?: string; lastUpdated: Date } {
    return {
      data: this.cache.systemLogs,
      error: this.cache.errors.systemLogs,
      lastUpdated: this.cache.lastUpdated
    };
  }

  getPowerInfo(): { data: PowerInformation | null; error?: string; lastUpdated: Date } {
    return {
      data: this.cache.powerInfo,
      error: this.cache.errors.powerInfo,
      lastUpdated: this.cache.lastUpdated
    };
  }

  getSystemInfo(): { data: SystemInformation | null; error?: string; lastUpdated: Date } {
    return {
      data: this.cache.systemInfo,
      error: this.cache.errors.systemInfo,
      lastUpdated: this.cache.lastUpdated
    };
  }

  getPidData(): { data: PidInfo[]; error?: string; lastUpdated: Date } {
    return {
      data: this.cache.pidData,
      error: this.cache.errors.pidData,
      lastUpdated: this.cache.lastUpdated
    };
  }

  // Force a refresh
  async refresh(): Promise<void> {
    // If already fetching, just wait for the current cycle to finish
    if (this.isFetching) {
      console.log('Data fetch already in progress, waiting for completion...');
      // Wait for current fetch to complete by checking the flag periodically
      while (this.isFetching) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    await this.fetchAllData();
  }

  // Helper methods (copied from existing services)
  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  private extractRecordNumbers(output: string): number[] {
    const lines = output.split('\n');
    const recordNumbers: number[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('record')) {
        const match = trimmedLine.match(/record(\d+)/);
        if (match) {
          recordNumbers.push(parseInt(match[1], 10));
        }
      }
    }
    
    return recordNumbers;
  }

  private parseLogRecord(output: string, recordNumber: number): SystemLogRecord | null {
    try {
      const lines = output.split('\n');
      let number = recordNumber;
      let severity: SystemLogRecord['severity'] = 'Informational';
      let date = '';
      let time = '';
      let description = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('number=')) {
          number = parseInt(trimmedLine.split('=')[1], 10);
        } else if (trimmedLine.startsWith('severity=')) {
          const severityValue = trimmedLine.split('=')[1];
          switch (severityValue) {
            case 'Caution':
              severity = 'Caution';
              break;
            case 'Critical':
              severity = 'Critical';
              break;
            case 'Informational':
              severity = 'Informational';
              break;
            case 'OK':
              severity = 'OK';
              break;
            default:
              severity = 'Informational';
          }
        } else if (trimmedLine.startsWith('date=')) {
          date = trimmedLine.split('=')[1];
        } else if (trimmedLine.startsWith('time=')) {
          time = trimmedLine.split('=')[1];
        } else if (trimmedLine.startsWith('description=')) {
          // Handle multi-line descriptions
          const parts = line.split('=');
          if (parts.length > 1) {
            description = parts.slice(1).join('=').trim();
          }
        }
      }
      
      if (date && time && description) {
        return {
          number,
          severity,
          date,
          time,
          description
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing log record:', error);
      return null;
    }
  }

  private parsePowerInfo(output: string): PowerInformation | null {
    try {
      // Parse power information using the same logic as the original power service
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
        powerRegulation: parseProperty(output, 'oemhp_powerreg'),
        powerCap: parseNumericProperty(output, 'oemhp_pwrcap'),
        presentPower: parseNumericProperty(output, 'oemhp_PresentPower'),
        averagePower: parseNumericProperty(output, 'oemhp_AvgPower'),
        maxPower: parseNumericProperty(output, 'oemhp_MaxPower'),
        minPower: parseNumericProperty(output, 'oemhp_MinPower'),
        powerSupplyCapacity: parseNumericProperty(output, 'oemhp_powersupplycapacity'),
        serverMaxPower: parseNumericProperty(output, 'oemhp_servermaxpower'),
        serverMinPower: parseNumericProperty(output, 'oemhp_serverminpower'),
        warningType: parseProperty(output, 'warning_type'),
        warningThreshold: parseNumericProperty(output, 'warning_threshold'),
        warningDuration: parseNumericProperty(output, 'warning_duration'),
        powerMicroVersion: parseProperty(output, 'oemhp_power_micro_ver'),
        autoPowerRestore: parseProperty(output, 'oemhp_auto_pwr')
      };

      return powerInfo;
    } catch (error) {
      console.error('Error parsing power info:', error);
      return null;
    }
  }

  private parseSystemInfo(system1Output: string, firmware1Output: string, systemFirmware1Output: string): SystemInformation | null {
    try {
      // Parse the outputs using the same logic as the original systemInfo service
      const parseValue = (output: string, key: string): string | null => {
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith(key)) {
            // Extract everything after the key, handling multi-word values
            const value = trimmedLine.substring(key.length).trim();
            // Remove quotes if present and return the full value
            return value.replace(/^["']|["']$/g, '');
          }
        }
        return null;
      };

      const parseDate = (output: string, key: string): string | null => {
        const lines = output.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith(key)) {
            // Extract everything after the key for date parsing
            const value = trimmedLine.substring(key.length).trim();
            // Remove quotes if present and return the full date value
            return value.replace(/^["']|["']$/g, '');
          }
        }
        return null;
      };

      // Parse using the same logic as the original service
      const model = parseValue(system1Output, "name=") || "Unknown";
      const serialNumber = parseValue(system1Output, "number=") || "Unknown";
      const iloGeneration = parseValue(firmware1Output, "name=") || "Unknown";
      
      // Parse System ROM (version + date) from system1/firmware1
      const systemRomVersion = parseValue(systemFirmware1Output, "version=") || "";
      const systemRomDate = parseDate(systemFirmware1Output, "date=") || "";
      const systemRom = systemRomVersion && systemRomDate 
        ? `${systemRomVersion} (${systemRomDate})`
        : systemRomVersion || systemRomDate || "Unknown";

      // Parse iLO Firmware (version + date) from /map1/firmware1
      const iloFirmwareVersion = parseValue(firmware1Output, "version=") || "";
      const iloFirmwareDate = parseDate(firmware1Output, "date=") || "";
      const iloFirmware = iloFirmwareVersion && iloFirmwareDate 
        ? `${iloFirmwareVersion} (${iloFirmwareDate})`
        : iloFirmwareVersion || iloFirmwareDate || "Unknown";

      const systemInfo: SystemInformation = {
        model,
        serialNumber,
        iloGeneration,
        systemRom,
        iloFirmware
      };

      return systemInfo;
    } catch (error) {
      console.error('Error parsing system info:', error);
      return null;
    }
  }

  private parsePidInfo(output: string): PidInfo[] {
    try {
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

      // Parse each data line
      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('--') || line.includes('===')) continue;

        // Split by whitespace and extract data
        const parts = line.split(/\s+/);
        if (parts.length >= 8) {
          try {
            const pidNumber = parseInt(parts[0], 10);
            if (!isNaN(pidNumber)) {
              pids.push({
                number: pidNumber,
                isActive: parts[1] === 'Active',
                setPoint: parseFloat(parts[3]) || 0,
                currentReading: parseFloat(parts[4]) || 0,
                output: parseFloat(parts[6]) || 0
              });
            }
          } catch {
            // Skip malformed lines
            continue;
          }
        }
      }

      return pids;
    } catch (error) {
      console.error('Error parsing PID info:', error);
      return [];
    }
  }
}

// Export singleton instance
export const centralizedDataFetcher = new CentralizedDataFetcher();
export default centralizedDataFetcher;
