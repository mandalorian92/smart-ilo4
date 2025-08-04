import { Router } from 'express';
import { historicalStorage, TIME_RANGES } from '../services/historicalStorage.js';

const router = Router();

// Get time range options
router.get('/time-ranges', (req, res) => {
  res.json(TIME_RANGES);
});

// Get sensor readings for a time range
router.get('/sensors', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange as string) || 15; // Default to 15 minutes
    const sensorName = req.query.sensorName as string;
    
    const readings = await historicalStorage.getSensorReadings(timeRange, sensorName);
    res.json(readings);
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
});

// Get fan readings for a time range
router.get('/fans', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange as string) || 15; // Default to 15 minutes
    const fanName = req.query.fanName as string;
    
    const readings = await historicalStorage.getFanReadings(timeRange, fanName);
    res.json(readings);
  } catch (error) {
    console.error('Error fetching fan readings:', error);
    res.status(500).json({ error: 'Failed to fetch fan readings' });
  }
});

// Get historical data by type
router.get('/data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const timeRange = parseInt(req.query.timeRange as string) || 15; // Default to 15 minutes
    
    const data = await historicalStorage.getHistoricalData(type, timeRange);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} data:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type} data` });
  }
});

// Get latest readings for dashboard
router.get('/latest/sensors', async (req, res) => {
  try {
    const readings = await historicalStorage.getLatestSensorReadings();
    res.json(readings);
  } catch (error) {
    console.error('Error fetching latest sensor readings:', error);
    res.status(500).json({ error: 'Failed to fetch latest sensor readings' });
  }
});

router.get('/latest/fans', async (req, res) => {
  try {
    const readings = await historicalStorage.getLatestFanReadings();
    res.json(readings);
  } catch (error) {
    console.error('Error fetching latest fan readings:', error);
    res.status(500).json({ error: 'Failed to fetch latest fan readings' });
  }
});

router.get('/latest/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = await historicalStorage.getLatestHistoricalData(type);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching latest ${req.params.type} data:`, error);
    res.status(500).json({ error: `Failed to fetch latest ${req.params.type} data` });
  }
});

// Get aggregated sensor data for charts
router.get('/aggregated/sensors', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange as string) || 15; // Default to 15 minutes
    const interval = parseInt(req.query.interval as string) || 1; // Default to 1 minute intervals
    
    const data = await historicalStorage.getAggregatedSensorData(timeRange, interval);
    res.json(data);
  } catch (error) {
    console.error('Error fetching aggregated sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch aggregated sensor data' });
  }
});

// Get chart data formatted for Chart.js
router.get('/chart/sensors', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange as string) || 15;
    const readings = await historicalStorage.getSensorReadings(timeRange);
    
    // Group readings by sensor
    const sensorGroups: { [key: string]: any[] } = {};
    readings.forEach(reading => {
      if (!sensorGroups[reading.sensor_name]) {
        sensorGroups[reading.sensor_name] = [];
      }
      sensorGroups[reading.sensor_name].push({
        x: reading.timestamp,
        y: reading.reading,
        status: reading.status
      });
    });

    // Format for Chart.js
    const datasets = Object.entries(sensorGroups).map(([sensorName, data], index) => {
      const colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)', 
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)',
        'rgb(199, 199, 199)',
        'rgb(83, 102, 147)'
      ];
      
      return {
        label: sensorName,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1
      };
    });

    res.json({
      datasets,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching chart sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch chart sensor data' });
  }
});

router.get('/chart/fans', async (req, res) => {
  try {
    const timeRange = parseInt(req.query.timeRange as string) || 15;
    const readings = await historicalStorage.getFanReadings(timeRange);
    
    // Group readings by fan
    const fanGroups: { [key: string]: any[] } = {};
    readings.forEach(reading => {
      if (!fanGroups[reading.fan_name]) {
        fanGroups[reading.fan_name] = [];
      }
      fanGroups[reading.fan_name].push({
        x: reading.timestamp,
        y: reading.speed,
        status: reading.status
      });
    });

    // Format for Chart.js
    const datasets = Object.entries(fanGroups).map(([fanName, data], index) => {
      const colors = [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(75, 192, 192)',
        'rgb(255, 205, 86)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
      ];
      
      return {
        label: fanName,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1
      };
    });

    res.json({
      datasets,
      timeRange
    });
  } catch (error) {
    console.error('Error fetching chart fan data:', error);
    res.status(500).json({ error: 'Failed to fetch chart fan data' });
  }
});

// Database viewer endpoints for History Tab
router.get('/database/stats', async (req, res) => {
  try {
    const stats = await historicalStorage.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

router.get('/database/data', async (req, res) => {
  try {
    const table = req.query.table as 'sensor_readings' | 'fan_readings' | 'historical_data' | 'all' || 'all';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const sortBy = req.query.sortBy as 'timestamp' | 'type' | 'name' || 'timestamp';
    const sortOrder = req.query.sortOrder as 'ASC' | 'DESC' || 'DESC';
    
    const result = await historicalStorage.getPaginatedData(table, page, pageSize, sortBy, sortOrder);
    res.json(result);
  } catch (error) {
    console.error('Error fetching paginated data:', error);
    res.status(500).json({ error: 'Failed to fetch paginated data' });
  }
});

router.get('/database/export', async (req, res) => {
  try {
    const table = req.query.table as 'sensor_readings' | 'fan_readings' | 'historical_data' | 'all' || 'all';
    const format = req.query.format as 'csv' | 'json' | 'txt' || 'csv';
    const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : undefined;
    
    const data = await historicalStorage.exportData(table, format, timeRange);
    
    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `ilo4-${table}-${timestamp}.${format}`;
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
