import { Router } from 'express';
import { getILoConfig, saveILoConfig, testILoConnection, isILoConfigured, clearILoConfig } from '../services/config.js';
import { getSystemInformation } from '../services/systemInfo.js';

const router = Router();

// Get current iLO configuration (without password for security)
router.get('/config', async (req, res) => {
  try {
    const config = await getILoConfig();
    if (config) {
      res.json({
        host: config.host,
        username: config.username,
        configured: true
      });
    } else {
      res.json({ configured: false });
    }
  } catch (error) {
    console.error('Error getting iLO config:', error);
    res.status(500).json({ error: 'Failed to get iLO configuration' });
  }
});

// Save iLO configuration
router.post('/config', async (req, res) => {
  try {
    const { host, username, password } = req.body;
    
    if (!host || !username || !password) {
      return res.status(400).json({ error: 'Host, username, and password are required' });
    }

    const config = { host, username, password };
    await saveILoConfig(config);
    
    // Initialize system information cache after successful iLO configuration
    console.log('iLO configuration saved, initializing system information cache...');
    setTimeout(async () => {
      try {
        await getSystemInformation();
        console.log('System information cache initialized successfully after iLO configuration');
      } catch (error) {
        console.error('Failed to initialize system information cache after iLO configuration:', error);
      }
    }, 1000); // Small delay to ensure configuration is fully persisted
    
    res.json({ success: true, message: 'iLO configuration saved successfully' });
  } catch (error) {
    console.error('Error saving iLO config:', error);
    res.status(500).json({ error: 'Failed to save iLO configuration' });
  }
});

// Test iLO connection
router.post('/test', async (req, res) => {
  try {
    const { host, username, password } = req.body;
    
    if (!host || !username || !password) {
      return res.status(400).json({ error: 'Host, username, and password are required' });
    }

    const config = { host, username, password };
    const isConnected = await testILoConnection(config);
    
    if (isConnected) {
      res.json({ success: true, message: 'iLO connection successful' });
    } else {
      res.json({ success: false, message: 'iLO connection failed' });
    }
  } catch (error) {
    console.error('Error testing iLO connection:', error);
    res.status(500).json({ error: 'Failed to test iLO connection' });
  }
});

// Check if iLO is configured
router.get('/status', async (req, res) => {
  try {
    const configured = await isILoConfigured();
    res.json({ configured });
  } catch (error) {
    console.error('Error checking iLO status:', error);
    res.status(500).json({ error: 'Failed to check iLO status' });
  }
});

// Reset iLO configuration (for testing purposes)
router.delete('/config', async (req, res) => {
  try {
    await clearILoConfig();
    res.json({ success: true, message: 'iLO configuration cleared successfully' });
  } catch (error) {
    console.error('Error clearing iLO config:', error);
    res.status(500).json({ error: 'Failed to clear iLO configuration' });
  }
});

export default router;
