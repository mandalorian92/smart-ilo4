import { runIloCommand } from "./sshClient.js";

export interface SystemLogRecord {
  number: number;
  severity: 'Caution' | 'Critical' | 'Informational' | 'OK';
  date: string;
  time: string;
  description: string;
}

export async function getRecentSystemLogs(): Promise<SystemLogRecord[]> {
  try {
    // First, get the list of log records
    const logListOutput = await runIloCommand("show system1/log1");
    
    // Parse the output to extract record numbers
    const recordNumbers = extractRecordNumbers(logListOutput);
    
    if (recordNumbers.length === 0) {
      console.warn('No log records found in system log');
      return [];
    }
    
    // Get the last 3 records
    const recentRecords = recordNumbers.slice(-3);
    
    // Fetch details for each recent record
    const logRecords: SystemLogRecord[] = [];
    
    for (const recordNumber of recentRecords) {
      try {
        const recordOutput = await runIloCommand(`show system1/log1/record${recordNumber}`);
        const record = parseLogRecord(recordOutput, recordNumber);
        if (record) {
          logRecords.push(record);
        }
      } catch (error) {
        console.error(`Failed to fetch record ${recordNumber}:`, error);
        // Continue with other records even if one fails
      }
    }
    
    // Sort by date/time (most recent first)
    const sortedRecords = logRecords.sort((a, b) => {
      try {
        const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
        const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
        return dateTimeB - dateTimeA;
      } catch {
        // If date parsing fails, maintain original order
        return 0;
      }
    });
    
    return sortedRecords;
    
  } catch (error) {
    console.error('Error fetching system logs:', error);
    // Return empty array on error instead of throwing
    return [];
  }
}

function extractRecordNumbers(output: string): number[] {
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

function parseLogRecord(output: string, recordNumber: number): SystemLogRecord | null {
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
        // Map severity values to our expected types
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
        description = trimmedLine.split('=')[1];
      }
    }
    
    // Validate that we have the required fields
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
