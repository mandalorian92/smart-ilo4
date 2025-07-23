import { Router } from "express";
import { getSensors, overrideSensor, resetSensorOverrides, getSensorHistory } from "../services/ilo.js";
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
    const sensorNames = sensors.map(sensor => ({
      name: sensor.name,
      context: sensor.context || 'Unknown',
      currentReading: sensor.reading
    }));
    res.json(sensorNames);
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

export default router;