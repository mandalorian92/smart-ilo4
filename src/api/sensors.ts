import { Router } from "express";
import { getSensors, overrideSensor, resetSensorOverrides, getSensorHistory } from "../services/ilo.js";
import { centralizedDataFetcher } from "../services/centralizedDataFetcher.js";
import { runIloCommand } from "../services/sshClient.js";

const router = Router();

// GET /sensors — current sensors (with overrides applied)
router.get("/", async (_req, res) => {
  try {
    const sensors = await getSensors();
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /sensors/available — get list of available sensor names for filtering
router.get("/available", async (_req, res) => {
  try {
    const sensors = await getSensors();
    
    const sensorNames = sensors.map((sensor: any) => ({
      name: sensor.name,
      context: sensor.context || 'Unknown',
      currentReading: sensor.reading,
      isActive: sensor.reading > 0
    }));
    
    // Get PID data from centralized fetcher
    const pidResult = centralizedDataFetcher.getPidData();
    const activePidNumbers = pidResult.data ? pidResult.data.filter((pid: any) => pid.isActive).map((pid: any) => pid.number) : [];
    
    res.json({
      sensors: sensorNames,
      activePidNumbers: activePidNumbers,
      activePidCount: activePidNumbers.length
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /sensors/history — past hour of individual sensor readings with proper timestamps
router.get("/history", (_req, res) => {
  try {
    const history = getSensorHistory();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /sensors/override — override a sensor reading
// { sensorId, value }
router.post("/override", (req, res) => {
  try {
    const { sensorId, value } = req.body;
    if (typeof sensorId !== "string" || typeof value !== "number") {
      res.status(400).json({ error: "sensorId and value are required" });
      return;
    }
    overrideSensor(sensorId, value);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /sensors/reset — clear all overrides
router.post("/reset", (_req, res) => {
  try {
    resetSensorOverrides();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /sensors/set-low-limit — set low limit for a sensor
// { sensorId, lowLimit }
router.post("/set-low-limit", async (req, res) => {
  try {
    const { sensorId, lowLimit } = req.body;
    if (typeof sensorId !== "number" || typeof lowLimit !== "number") {
      res.status(400).json({ error: "sensorId and lowLimit are required and must be numbers" });
      return;
    }
    
    // Execute the fan pid command via SSH
    const command = `fan pid ${sensorId} lo ${lowLimit}`;
    console.log(`Executing command: ${command}`);
    
    try {
      const result = await runIloCommand(command);
      console.log(`Command result: ${result}`);
      
      res.json({ 
        ok: true, 
        message: `Low limit set to ${lowLimit/100}% for sensor ${sensorId}`,
        command: command,
        result: result
      });
    } catch (sshError) {
      console.error(`SSH command failed: ${sshError}`);
      res.status(500).json({ 
        error: `Failed to execute command: ${sshError}`,
        command: command
      });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /sensors/pids — get PID algorithm information using centralized fetcher
router.get("/pids", async (_req, res) => {
  try {
    const result = centralizedDataFetcher.getPidData();
    
    if (result.error) {
      console.error('Error getting all PIDs:', result.error);
      return res.status(500).json({ error: result.error });
    }
    
    if (!result.data) {
      if (!centralizedDataFetcher.isRunning()) {
        return res.status(500).json({ error: 'PID data service is not running. Please check iLO configuration.' });
      }
      
      return res.json([]); // Return empty array if no data
    }
    
    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /sensors/active-pids — get only active PID algorithms using centralized fetcher
router.get("/active-pids", async (_req, res) => {
  try {
    const result = centralizedDataFetcher.getPidData();
    
    if (result.error) {
      console.error('Error getting active PIDs:', result.error);
      return res.status(500).json({ error: result.error });
    }
    
    if (!result.data) {
      if (!centralizedDataFetcher.isRunning()) {
        return res.status(500).json({ error: 'PID data service is not running. Please check iLO configuration.' });
      }
      
      const lastUpdated = result.lastUpdated.getTime();
      const now = new Date().getTime();
      
      if (now - lastUpdated < 30000) {
        return res.status(202).json({ error: 'PID data still being fetched, this is normal during initial setup' });
      }
      
      return res.json([]); // Return empty array if no data
    }
    
    // Filter for active PIDs only
    const activePids = result.data.filter((pid: any) => pid.isActive);
    res.json(activePids);
  } catch (err) {
    console.error('Error getting active PIDs:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;