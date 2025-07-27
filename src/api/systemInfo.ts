import { Router } from "express";
import { centralizedDataFetcher } from "../services/centralizedDataFetcher.js";

const router = Router();

// Get system information
router.get("/info", async (_req, res) => {
  try {
    const result = centralizedDataFetcher.getSystemInfo();
    
    if (result.error) {
      console.error("Error fetching system information:", result.error);
      return res.status(500).json({ error: result.error });
    }
    
    if (!result.data) {
      // Check if fetcher is running and give more helpful error
      if (!centralizedDataFetcher.isRunning()) {
        return res.status(500).json({ error: 'System information service is not running. Please check iLO configuration.' });
      }
      
      // If fetcher is running but no data yet, it might still be fetching
      const lastUpdated = result.lastUpdated.getTime();
      const now = new Date().getTime();
      
      if (now - lastUpdated < 30000) { // Less than 30 seconds old
        return res.status(202).json({ error: 'System information still being fetched, this is normal during initial setup' });
      }
      
      return res.status(500).json({ error: 'No system information available. Please check iLO connection.' });
    }
    
    res.json(result.data);
  } catch (err) {
    console.error("Error fetching system information:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Force refresh system information
router.post("/info/refresh", async (_req, res) => {
  try {
    // Check if already fetching to prevent the "Already fetching data" message
    if (centralizedDataFetcher.isRunning()) {
      // Just return the current cached data instead of triggering a new fetch
      const result = centralizedDataFetcher.getSystemInfo();
      
      if (result.data) {
        return res.json(result.data);
      } else if (result.error) {
        return res.status(500).json({ error: result.error });
      } else {
        return res.status(202).json({ error: 'System information still being fetched, please wait...' });
      }
    }
    
    // Only refresh if not already running
    await centralizedDataFetcher.refresh();
    const result = centralizedDataFetcher.getSystemInfo();
    
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    
    if (!result.data) {
      return res.status(500).json({ error: 'No system information available after refresh.' });
    }
    
    res.json(result.data);
  } catch (err) {
    console.error("Error refreshing system information:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
