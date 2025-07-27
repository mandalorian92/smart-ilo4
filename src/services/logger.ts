// Backend log capture service
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

class LogCapture {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 200; // Keep last 200 log entries
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };

    // Override console methods to capture logs
    this.interceptConsoleLogs();
  }

  private interceptConsoleLogs() {
    // Override console.log
    console.log = (...args: any[]) => {
      this.addLog('info', this.formatMessage(args));
      this.originalConsole.log(...args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      this.addLog('warn', this.formatMessage(args));
      this.originalConsole.warn(...args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      this.addLog('error', this.formatMessage(args));
      this.originalConsole.error(...args);
    };
  }

  private formatMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  private addLog(level: LogEntry['level'], message: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs]; // Return a copy
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  clearLogs(): void {
    this.logs = [];
  }

  restoreOriginalConsole(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }
}

// Create singleton instance
export const logCapture = new LogCapture();

// Export convenience functions
export function getLogs(): LogEntry[] {
  return logCapture.getLogs();
}

export function getRecentLogs(count?: number): LogEntry[] {
  return logCapture.getRecentLogs(count);
}

export function clearLogs(): void {
  return logCapture.clearLogs();
}
