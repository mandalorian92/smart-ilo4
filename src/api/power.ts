import { Router } from 'express';
import { centralizedDataFetcher } from '../services/centralizedDataFetcher.js';

const router = Router();

// Get power information
router.get('/info', async (req, res) => {
  try {
    const result = centralizedDataFetcher.getPowerInfo();
    
    if (result.error) {
      console.error('Error getting power information:', result.error);
      return res.status(500).json({ error: result.error });
    }
    
    if (!result.data) {
      if (!centralizedDataFetcher.isRunning()) {
        return res.status(500).json({ error: 'Power monitoring service is not running. Please check iLO configuration.' });
      }
      
      const lastUpdated = result.lastUpdated.getTime();
      const now = new Date().getTime();
      
      if (now - lastUpdated < 30000) {
        return res.status(202).json({ error: 'Power information still being fetched, this is normal during initial setup' });
      }
      
      return res.status(500).json({ error: 'No power information available. Please check iLO connection.' });
    }
    
    res.json(result.data);
  } catch (error) {
    console.error('Error getting power information:', error);
    res.status(500).json({ error: 'Failed to get power information' });
  }
});

// Refresh power information
router.post('/refresh', async (req, res) => {
  try {
    // Check if already fetching to prevent conflicts
    if (centralizedDataFetcher.isRunning()) {
      const result = centralizedDataFetcher.getPowerInfo();
      
      if (result.data) {
        return res.json(result.data);
      } else if (result.error) {
        return res.status(500).json({ error: result.error });
      } else {
        return res.status(202).json({ error: 'Power information still being fetched, please wait...' });
      }
    }
    
    await centralizedDataFetcher.refresh();
    const result = centralizedDataFetcher.getPowerInfo();
    
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    
    if (!result.data) {
      return res.status(500).json({ error: 'No power information available after refresh.' });
    }
    
    res.json(result.data);
  } catch (error) {
    console.error('Error refreshing power information:', error);
    res.status(500).json({ error: 'Failed to refresh power information' });
  }
});

export default router;
