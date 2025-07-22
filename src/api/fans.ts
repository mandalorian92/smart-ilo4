import { Router } from "express";
import { 
  getFans, 
  overrideFan, 
  resetFanOverrides, 
  setFanSpeed, 
  unlockFanControl,
  lockFanAtSpeed,
  setPidLowLimit,
  getFanInfo,
  getFanPidInfo,
  getFanGroupInfo
} from "../services/ilo.js";

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

// POST /fans/unlock — unlock manual fan control via SSH
router.post("/unlock", async (_req, res) => {
  try {
    await unlockFanControl();
    res.json({ success: true, message: "Fan control unlocked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST /fans/lock — lock specific fan at a speed
router.post("/lock", async (req, res) => {
  try {
    const { fanId, speed } = req.body;
    if (fanId === undefined || speed === undefined) {
      return res.status(400).json({ error: "fanId and speed are required" });
    }
    await lockFanAtSpeed(fanId, speed);
    res.json({ success: true, message: `Fan ${fanId} locked at ${speed}%` });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST /fans/pid-low-limit — set PID low limit
router.post("/pid-low-limit", async (req, res) => {
  try {
    const { pidId, lowLimit } = req.body;
    if (pidId === undefined || lowLimit === undefined) {
      return res.status(400).json({ error: "pidId and lowLimit are required" });
    }
    await setPidLowLimit(pidId, lowLimit);
    res.json({ success: true, message: `PID ${pidId} low limit set to ${lowLimit}%` });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /fans/info — get detailed fan information
router.get("/info", async (_req, res) => {
  try {
    const info = await getFanInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /fans/pid-info — get PID algorithm information
router.get("/pid-info", async (_req, res) => {
  try {
    const info = await getFanPidInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /fans/group-info — get fan grouping information
router.get("/group-info", async (_req, res) => {
  try {
    const info = await getFanGroupInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;