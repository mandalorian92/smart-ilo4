import { Router } from 'express';
import { centralizedDataFetcher } from '../services/centralizedDataFetcher.js';

const router = Router();

// Get recent system log entries
router.get('/recent', async (req, res) => {
  try {
    const result = centralizedDataFetcher.getSystemLogs();
    
    if (result.error) {
      console.error('Error fetching recent system logs:', result.error);
      // Return empty array for UX but log the error
      return res.json([]);
    }
    
    if (!result.data || result.data.length === 0) {
      if (!centralizedDataFetcher.isRunning()) {
        console.log('System logs service is not running');
        return res.json([]);
      }
      
      const lastUpdated = result.lastUpdated.getTime();
      const now = new Date().getTime();
      
      if (now - lastUpdated < 30000) {
        console.log('System logs still being fetched, this is normal during initial setup');
        return res.json([]);
      }
      
      console.log('System logs are being fetched or no logs available');
      return res.json([]);
    }
    
    // Ensure we always return an array
    res.json(Array.isArray(result.data) ? result.data : []);
  } catch (error: any) {
    console.error('Error fetching recent system logs:', error);
    // Return empty array instead of error for better UX
    res.json([]);
  }
});

export default router;
