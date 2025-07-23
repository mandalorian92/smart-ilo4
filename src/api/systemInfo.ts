import { Router } from "express";
import { getSystemInformation, systemInfoCache } from "../services/systemInfo.js";

const router = Router();

// Get system information
router.get("/info", async (_req, res) => {
  try {
    const systemInfo = await getSystemInformation();
    res.json(systemInfo);
  } catch (err) {
    console.error("Error fetching system information:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Force refresh system information
router.post("/info/refresh", async (_req, res) => {
  try {
    const systemInfo = await systemInfoCache.refreshSystemInfo();
    res.json(systemInfo);
  } catch (err) {
    console.error("Error refreshing system information:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
