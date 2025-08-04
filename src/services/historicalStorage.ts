import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

// Database interfaces
export interface HistoricalDataPoint {
  id?: number;
  timestamp: number;
  type: 'thermal' | 'power' | 'system_info' | 'system_log' | 'pid';
  data: any;
  created_at?: string;
}

export interface SensorReading {
  id?: number;
  timestamp: number;
  sensor_name: string;
  reading: number;
  status: string;
  type: string;
  context?: string;
  critical?: number;
  fatal?: number;
  created_at?: string;
}

export interface FanReading {
  id?: number;
  timestamp: number;
  fan_name: string;
  speed: number;
  status: string;
  health?: string;
  created_at?: string;
}

export interface TimeRange {
  minutes: number;
  label: string;
}

export const TIME_RANGES: TimeRange[] = [
  { minutes: 5, label: '5 min' },
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 1440, label: '1 day' }
];

class HistoricalStorage {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'historical.db');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Initialize SQLite database
      this.db = new sqlite3.Database(this.dbPath);
      
      await this.createTables();
      await this.setupCleanupSchedule();
      
      this.isInitialized = true;
      console.log('Historical storage initialized successfully');
      
      // Check if database is empty and add test data if needed
      await this.checkAndAddTestData();
    } catch (error) {
      console.error('Failed to initialize historical storage:', error);
      throw error;
    }
  }

  // Check if database is empty and add test data for demonstration
  private async checkAndAddTestData(): Promise<void> {
    if (!this.isInitialized || !this.db) return;

    return new Promise((resolve) => {
      this.db!.get('SELECT COUNT(*) as count FROM sensor_readings', (err, row: any) => {
        if (err) {
          console.error('Error checking database:', err);
          resolve();
          return;
        }

        if (row.count === 0) {
          console.log('Database is empty, adding test data for demonstration...');
          this.addTestData().catch(console.error).finally(() => resolve());
        } else {
          console.log(`Database contains ${row.count} sensor readings`);
          resolve();
        }
      });
    });
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const statements = [
        // General historical data table
        `CREATE TABLE IF NOT EXISTS historical_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Sensor readings table (optimized for time-series queries)
        `CREATE TABLE IF NOT EXISTS sensor_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          sensor_name TEXT NOT NULL,
          reading REAL NOT NULL,
          status TEXT NOT NULL,
          type TEXT NOT NULL,
          context TEXT,
          critical REAL,
          fatal REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Fan readings table
        `CREATE TABLE IF NOT EXISTS fan_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          fan_name TEXT NOT NULL,
          speed INTEGER NOT NULL,
          status TEXT NOT NULL,
          health TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Create indexes
        `CREATE INDEX IF NOT EXISTS idx_historical_data_timestamp_type ON historical_data(timestamp, type)`,
        `CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp_name ON sensor_readings(timestamp, sensor_name)`,
        `CREATE INDEX IF NOT EXISTS idx_fan_readings_timestamp_name ON fan_readings(timestamp, fan_name)`
      ];

      const executeStatements = async () => {
        for (const statement of statements) {
          try {
            await new Promise<void>((resolve, reject) => {
              this.db!.run(statement, (err) => {
                if (err) {
                  console.error('Error executing SQL statement:', statement, err);
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
          } catch (error) {
            console.error('Failed to execute statement:', statement, error);
            throw error;
          }
        }
      };

      executeStatements()
        .then(() => {
          console.log('All database tables and indexes created successfully');
          resolve();
        })
        .catch(reject);
    });
  }

  private setupCleanupSchedule(): Promise<void> {
    return new Promise((resolve) => {
      // Clean up data older than 72 hours every hour
      setInterval(() => {
        this.cleanupOldData().catch(console.error);
      }, 60 * 60 * 1000); // 1 hour

      // Initial cleanup
      this.cleanupOldData().catch(console.error);
      resolve();
    });
  }

  private cleanupOldData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const seventyTwoHoursAgo = Date.now() - (72 * 60 * 60 * 1000);
      
      const cleanupQueries = [
        'DELETE FROM historical_data WHERE timestamp < ?',
        'DELETE FROM sensor_readings WHERE timestamp < ?',
        'DELETE FROM fan_readings WHERE timestamp < ?'
      ];

      let completed = 0;
      const total = cleanupQueries.length;

      cleanupQueries.forEach((sql) => {
        this.db!.run(sql, [seventyTwoHoursAgo], (err) => {
          if (err) {
            console.error('Error cleaning up old data:', err);
          }
          
          completed++;
          if (completed === total) {
            console.log('Old data cleanup completed');
            resolve();
          }
        });
      });
    });
  }

  // Store thermal data (sensors and fans)
  async storeThermalData(sensors: any[], fans: any[]): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const timestamp = Date.now();
    
    return new Promise((resolve, reject) => {
      const sensorInserts = sensors.map(sensor => 
        new Promise<void>((res, rej) => {
          this.db!.run(
            'INSERT INTO sensor_readings (timestamp, sensor_name, reading, status, type, context, critical, fatal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [timestamp, sensor.name, sensor.reading, sensor.status, sensor.type, sensor.context, sensor.critical, sensor.fatal],
            (err) => err ? rej(err) : res()
          );
        })
      );

      const fanInserts = fans.map(fan => 
        new Promise<void>((res, rej) => {
          this.db!.run(
            'INSERT INTO fan_readings (timestamp, fan_name, speed, status, health) VALUES (?, ?, ?, ?, ?)',
            [timestamp, fan.name, fan.speed, fan.status, fan.health],
            (err) => err ? rej(err) : res()
          );
        })
      );

      Promise.all([...sensorInserts, ...fanInserts])
        .then(() => {
          console.log(`Stored thermal data: ${sensors.length} sensors, ${fans.length} fans`);
          resolve();
        })
        .catch(reject);
    });
  }

  // Store general historical data
  async storeHistoricalData(type: string, data: any): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const timestamp = Date.now();
    
    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT INTO historical_data (timestamp, type, data) VALUES (?, ?, ?)',
        [timestamp, type, JSON.stringify(data)],
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`Stored ${type} data`);
            resolve();
          }
        }
      );
    });
  }

  // Get sensor readings for a time range
  async getSensorReadings(timeRangeMinutes: number, sensorName?: string): Promise<SensorReading[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const startTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM sensor_readings WHERE timestamp >= ?';
      const params: any[] = [startTime];
      
      if (sensorName) {
        sql += ' AND sensor_name = ?';
        params.push(sensorName);
      }
      
      sql += ' ORDER BY timestamp ASC';
      
      this.db!.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as SensorReading[]);
        }
      });
    });
  }

  // Get fan readings for a time range
  async getFanReadings(timeRangeMinutes: number, fanName?: string): Promise<FanReading[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const startTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM fan_readings WHERE timestamp >= ?';
      const params: any[] = [startTime];
      
      if (fanName) {
        sql += ' AND fan_name = ?';
        params.push(fanName);
      }
      
      sql += ' ORDER BY timestamp ASC';
      
      this.db!.all(sql, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as FanReading[]);
        }
      });
    });
  }

  // Get historical data for a time range and type
  async getHistoricalData(type: string, timeRangeMinutes: number): Promise<HistoricalDataPoint[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const startTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM historical_data WHERE type = ? AND timestamp >= ? ORDER BY timestamp ASC',
        [type, startTime],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const data = rows.map(row => ({
              ...row,
              data: JSON.parse(row.data)
            }));
            resolve(data as HistoricalDataPoint[]);
          }
        }
      );
    });
  }

  // Get latest readings for dashboard
  async getLatestSensorReadings(): Promise<SensorReading[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT sr1.* FROM sensor_readings sr1
         INNER JOIN (
           SELECT sensor_name, MAX(timestamp) as max_timestamp
           FROM sensor_readings
           GROUP BY sensor_name
         ) sr2 ON sr1.sensor_name = sr2.sensor_name AND sr1.timestamp = sr2.max_timestamp
         ORDER BY sr1.sensor_name`,
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as SensorReading[]);
          }
        }
      );
    });
  }

  // Get latest fan readings for dashboard
  async getLatestFanReadings(): Promise<FanReading[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT fr1.* FROM fan_readings fr1
         INNER JOIN (
           SELECT fan_name, MAX(timestamp) as max_timestamp
           FROM fan_readings
           GROUP BY fan_name
         ) fr2 ON fr1.fan_name = fr2.fan_name AND fr1.timestamp = fr2.max_timestamp
         ORDER BY fr1.fan_name`,
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as FanReading[]);
          }
        }
      );
    });
  }

  // Get latest historical data by type
  async getLatestHistoricalData(type: string): Promise<HistoricalDataPoint | null> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM historical_data WHERE type = ? ORDER BY timestamp DESC LIMIT 1',
        [type],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve({
              ...row,
              data: JSON.parse(row.data)
            } as HistoricalDataPoint);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  // Get aggregated sensor data for charts (averaging readings over time intervals)
  async getAggregatedSensorData(timeRangeMinutes: number, intervalMinutes: number = 1): Promise<any[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const startTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    const intervalMs = intervalMinutes * 60 * 1000;
    
    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT 
           sensor_name,
           ((timestamp / ?) * ?) as interval_start,
           AVG(reading) as avg_reading,
           MIN(reading) as min_reading,
           MAX(reading) as max_reading,
           COUNT(*) as sample_count
         FROM sensor_readings 
         WHERE timestamp >= ?
         GROUP BY sensor_name, interval_start
         ORDER BY sensor_name, interval_start`,
        [intervalMs, intervalMs, startTime],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve) => {
        this.db!.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          this.db = null;
          this.isInitialized = false;
          resolve();
        });
      });
    }
  }

  // Add test data for demonstration purposes
  async addTestData(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    console.log('Adding test data to database...');
    
    const now = Date.now();
    const testSensors = [
      { name: 'CPU Temperature', reading: 65.5, status: 'OK', type: 'temperature', context: 'cpu', critical: 85, fatal: 95 },
      { name: 'System Ambient', reading: 28.2, status: 'OK', type: 'temperature', context: 'ambient', critical: 40, fatal: 50 },
      { name: 'Memory Temperature', reading: 42.1, status: 'OK', type: 'temperature', context: 'memory', critical: 75, fatal: 85 },
      { name: 'Power Supply Temperature', reading: 55.3, status: 'OK', type: 'temperature', context: 'power_supply', critical: 70, fatal: 80 },
      { name: 'Peripheral Temperature', reading: 35.7, status: 'OK', type: 'temperature', context: 'peripheral', critical: 60, fatal: 70 }
    ];

    const testFans = [
      { name: 'CPU Fan 1', speed: 65, status: 'OK', health: 'Good' },
      { name: 'CPU Fan 2', speed: 68, status: 'OK', health: 'Good' },
      { name: 'System Fan 1', speed: 45, status: 'OK', health: 'Good' },
      { name: 'System Fan 2', speed: 47, status: 'OK', health: 'Good' },
      { name: 'PSU Fan', speed: 55, status: 'OK', health: 'Good' }
    ];

    // Add multiple data points over time (last 2 hours)
    for (let i = 0; i < 24; i++) { // 24 points = 2 hours with 5min intervals
      const timestamp = now - (i * 5 * 60 * 1000); // 5 minutes apart
      
      // Add some variation to the readings
      const variation = Math.random() * 4 - 2; // ±2 degrees variation
      
      const sensorPromises = testSensors.map(sensor => 
        new Promise<void>((resolve, reject) => {
          this.db!.run(
            'INSERT INTO sensor_readings (timestamp, sensor_name, reading, status, type, context, critical, fatal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [timestamp, sensor.name, sensor.reading + variation, sensor.status, sensor.type, sensor.context, sensor.critical, sensor.fatal],
            (err) => err ? reject(err) : resolve()
          );
        })
      );

      const fanPromises = testFans.map(fan => 
        new Promise<void>((resolve, reject) => {
          const speedVariation = Math.floor(Math.random() * 10 - 5); // ±5% speed variation
          this.db!.run(
            'INSERT INTO fan_readings (timestamp, fan_name, speed, status, health) VALUES (?, ?, ?, ?, ?)',
            [timestamp, fan.name, Math.max(0, fan.speed + speedVariation), fan.status, fan.health],
            (err) => err ? reject(err) : resolve()
          );
        })
      );

      await Promise.all([...sensorPromises, ...fanPromises]);
    }

    // Add some historical data entries
    const historicalDataPromises = [
      this.storeHistoricalData('system_info', { cpu_count: 2, memory_gb: 16, uptime_hours: 48.5 }),
      this.storeHistoricalData('power', { consumption_watts: 145, efficiency: 92.5, status: 'optimal' }),
      this.storeHistoricalData('system_log', { level: 'info', message: 'System running normally', component: 'thermal_management' })
    ];

    await Promise.all(historicalDataPromises);
    
    console.log('Test data added successfully');
  }

  // Database viewer methods for History Tab
  async getDatabaseStats(): Promise<{
    totalRecords: number;
    sensorRecords: number;
    fanRecords: number;
    historicalRecords: number;
    oldestRecord: string;
    newestRecord: string;
    databaseSize: string;
  }> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as count FROM sensor_readings',
        'SELECT COUNT(*) as count FROM fan_readings', 
        'SELECT COUNT(*) as count FROM historical_data',
        'SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM (SELECT timestamp FROM sensor_readings UNION ALL SELECT timestamp FROM fan_readings UNION ALL SELECT timestamp FROM historical_data)'
      ];

      Promise.all(queries.map(query => 
        new Promise<any>((resolve, reject) => {
          this.db!.get(query, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        })
      )).then(async ([sensors, fans, historical, timeRange]) => {
        // Calculate database file size
        let databaseSize = 'Unknown';
        try {
          const stats = await fs.stat(this.dbPath);
          const sizeInBytes = stats.size;
          if (sizeInBytes < 1024) {
            databaseSize = `${sizeInBytes} B`;
          } else if (sizeInBytes < 1024 * 1024) {
            databaseSize = `${(sizeInBytes / 1024).toFixed(2)} KB`;
          } else {
            databaseSize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
          }
        } catch (error) {
          console.error('Error getting database size:', error);
        }

        resolve({
          totalRecords: sensors.count + fans.count + historical.count,
          sensorRecords: sensors.count,
          fanRecords: fans.count,
          historicalRecords: historical.count,
          oldestRecord: timeRange.oldest ? new Date(timeRange.oldest).toISOString() : 'N/A',
          newestRecord: timeRange.newest ? new Date(timeRange.newest).toISOString() : 'N/A',
          databaseSize
        });
      }).catch(reject);
    });
  }

  async getPaginatedData(
    table: 'sensor_readings' | 'fan_readings' | 'historical_data' | 'all',
    page: number = 1,
    pageSize: number = 50,
    sortBy: 'timestamp' | 'type' | 'name' = 'timestamp',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{
    data: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    const offset = (page - 1) * pageSize;

    return new Promise((resolve, reject) => {
      let dataQuery: string;
      let countQuery: string;

      if (table === 'all') {
        dataQuery = `
          SELECT 'sensor' as table_type, id, timestamp, sensor_name as name, reading as value, status, type, context, null as health, created_at 
          FROM sensor_readings
          UNION ALL
          SELECT 'fan' as table_type, id, timestamp, fan_name as name, speed as value, status, 'fan' as type, null as context, health, created_at 
          FROM fan_readings
          UNION ALL
          SELECT 'historical' as table_type, id, timestamp, type as name, null as value, 'stored' as status, type, null as context, null as health, created_at 
          FROM historical_data
          ORDER BY ${sortBy === 'name' ? 'name' : sortBy} ${sortOrder}
          LIMIT ? OFFSET ?
        `;
        countQuery = `
          SELECT COUNT(*) as count FROM (
            SELECT id FROM sensor_readings
            UNION ALL
            SELECT id FROM fan_readings
            UNION ALL
            SELECT id FROM historical_data
          )
        `;
      } else {
        const orderColumn = sortBy === 'name' ? 
          (table === 'sensor_readings' ? 'sensor_name' : 
           table === 'fan_readings' ? 'fan_name' : 'type') : 
          sortBy;
        
        dataQuery = `SELECT * FROM ${table} ORDER BY ${orderColumn} ${sortOrder} LIMIT ? OFFSET ?`;
        countQuery = `SELECT COUNT(*) as count FROM ${table}`;
      }

      // Get total count first
      this.db!.get(countQuery, (err, countRow: any) => {
        if (err) {
          reject(err);
          return;
        }

        const totalCount = countRow.count;
        const totalPages = Math.ceil(totalCount / pageSize);

        // Get paginated data
        this.db!.all(dataQuery, [pageSize, offset], (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            // Parse JSON data for historical_data table
            const processedRows = rows.map(row => {
              if (row.table_type === 'historical' || (!row.table_type && table === 'historical_data')) {
                try {
                  return {
                    ...row,
                    data: row.data ? JSON.parse(row.data) : null
                  };
                } catch {
                  return row;
                }
              }
              return row;
            });

            resolve({
              data: processedRows,
              totalCount,
              totalPages,
              currentPage: page
            });
          }
        });
      });
    });
  }

  async exportData(
    table: 'sensor_readings' | 'fan_readings' | 'historical_data' | 'all',
    format: 'csv' | 'json' | 'txt',
    timeRangeMinutes?: number
  ): Promise<string> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Historical storage not initialized');
    }

    return new Promise((resolve, reject) => {
      let query: string;
      const params: any[] = [];

      const timeFilter = timeRangeMinutes ? 
        `WHERE timestamp >= ?` : '';
      
      if (timeRangeMinutes) {
        params.push(Date.now() - (timeRangeMinutes * 60 * 1000));
      }

      if (table === 'all') {
        query = `
          SELECT 'sensor' as table_type, timestamp, sensor_name as name, reading as value, status, type, context, created_at 
          FROM sensor_readings ${timeFilter}
          UNION ALL
          SELECT 'fan' as table_type, timestamp, fan_name as name, speed as value, status, 'fan' as type, health as context, created_at 
          FROM fan_readings ${timeFilter.replace('WHERE', timeFilter ? 'WHERE' : 'WHERE')}
          UNION ALL
          SELECT 'historical' as table_type, timestamp, type as name, data as value, 'stored' as status, type, null as context, created_at 
          FROM historical_data ${timeFilter.replace('WHERE', timeFilter ? 'WHERE' : 'WHERE')}
          ORDER BY timestamp DESC
        `;
      } else {
        query = `SELECT * FROM ${table} ${timeFilter} ORDER BY timestamp DESC`;
      }

      this.db!.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          let output: string;

          switch (format) {
            case 'csv':
              if (rows.length === 0) {
                output = 'No data found';
              } else {
                const headers = Object.keys(rows[0]);
                const csvRows = [
                  headers.join(','),
                  ...rows.map(row => 
                    headers.map(header => {
                      const value = row[header];
                      if (value === null || value === undefined) return '';
                      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                      if (typeof value === 'string' && value.includes(',')) return `"${value.replace(/"/g, '""')}"`;
                      return value;
                    }).join(',')
                  )
                ];
                output = csvRows.join('\n');
              }
              break;

            case 'json':
              output = JSON.stringify(rows, null, 2);
              break;

            case 'txt':
              if (rows.length === 0) {
                output = 'No data found';
              } else {
                output = rows.map(row => {
                  const timestamp = new Date(row.timestamp).toISOString();
                  if (table === 'sensor_readings' || row.table_type === 'sensor') {
                    return `${timestamp} | SENSOR | ${row.sensor_name || row.name} | ${row.reading || row.value}°C | ${row.status}`;
                  } else if (table === 'fan_readings' || row.table_type === 'fan') {
                    return `${timestamp} | FAN | ${row.fan_name || row.name} | ${row.speed || row.value}% | ${row.status}`;
                  } else {
                    return `${timestamp} | ${row.type.toUpperCase()} | ${typeof row.data === 'object' ? JSON.stringify(row.data) : row.data}`;
                  }
                }).join('\n');
              }
              break;

            default:
              throw new Error('Unsupported format');
          }

          resolve(output);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

// Export singleton instance
export const historicalStorage = new HistoricalStorage();
export default historicalStorage;
