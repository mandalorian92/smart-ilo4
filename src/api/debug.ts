import { Router } from "express";
import { getLogs, getRecentLogs, clearLogs } from "../services/logger.js";

const router = Router();

// GET /api/debug/logs - Get all backend logs
router.get("/logs", (_req, res) => {
  try {
    const logs = getLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// GET /api/debug/logs/recent - Get recent backend logs
router.get("/logs/recent", (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 50;
    const logs = getRecentLogs(count);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ error: 'Failed to fetch recent logs' });
  }
});

// DELETE /api/debug/logs - Clear all logs
router.delete("/logs", (_req, res) => {
  try {
    clearLogs();
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;