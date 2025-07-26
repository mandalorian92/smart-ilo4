import { Router } from 'express';
import { getPowerInformation, refreshPowerInformation } from '../services/power.js';

const router = Router();

// Get power information
router.get('/info', async (req, res) => {
  try {
    const powerInfo = await getPowerInformation();
    res.json(powerInfo);
  } catch (error) {
    console.error('Error getting power information:', error);
    res.status(500).json({ error: 'Failed to get power information' });
  }
});

// Refresh power information
router.post('/refresh', async (req, res) => {
  try {
    const powerInfo = await refreshPowerInformation();
    res.json(powerInfo);
  } catch (error) {
    console.error('Error refreshing power information:', error);
    res.status(500).json({ error: 'Failed to refresh power information' });
  }
});

export default router;
