import { Router } from "express";
import { getSensors, overrideSensor, resetSensorOverrides, getSensorHistory } from "../services/ilo.js";

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

// GET /sensors/history — past hour of avg temperature samples [{ time, avgTemp }]
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

export default router;