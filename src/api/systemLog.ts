import { Router } from 'express';
import { getRecentSystemLogs } from '../services/systemLog.js';

const router = Router();

// Get recent system log entries
router.get('/recent', async (req, res) => {
  try {
    const logs = await getRecentSystemLogs();
    // Ensure we always return an array
    res.json(Array.isArray(logs) ? logs : []);
  } catch (error: any) {
    console.error('Error fetching recent system logs:', error);
    // Return empty array instead of error for better UX
    res.json([]);
  }
});

export default router;
