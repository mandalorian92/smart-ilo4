import { Router } from "express";
import { getFans, overrideFan, resetFanOverrides, setFanSpeed } from "../services/ilo.js";

const router = Router();

// GET /fans — current fan speeds
router.get("/", async (_req, res) => {
  try {
    const fans = await getFans();
    res.json(fans);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /fans/override — override a specific fan speed
router.post("/override", async (req, res) => {
  try {
    const { fanId, speed } = req.body;
    if (!fanId || speed === undefined) {
      return res.status(400).json({ error: "fanId and speed are required" });
    }
    overrideFan(fanId, speed);
    res.json({ success: true, message: `Fan ${fanId} speed overridden to ${speed}%` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /fans/set-all — set all fans to the same speed
router.post("/set-all", async (req, res) => {
  try {
    const { speed } = req.body;
    if (speed === undefined) {
      return res.status(400).json({ error: "speed is required" });
    }
    await setFanSpeed(speed);
    res.json({ success: true, message: `All fans set to ${speed}%` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /fans/reset — reset all fan overrides
router.post("/reset", async (_req, res) => {
  try {
    resetFanOverrides();
    res.json({ success: true, message: "All fan overrides reset" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;