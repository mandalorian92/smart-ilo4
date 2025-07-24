import { Router } from 'express';
import { getAppConfig, saveAppConfig } from '../services/appConfig';

const router = Router();

// Get current app configuration
router.get('/config', async (req, res) => {
  try {
    const config = await getAppConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting app config:', error);
    res.status(500).json({ error: 'Failed to get app configuration' });
  }
});

// Save app configuration
router.post('/config', async (req, res) => {
  try {
    const { port, sessionTimeout } = req.body;
    
    if (!port || !sessionTimeout) {
      return res.status(400).json({ error: 'Port and sessionTimeout are required' });
    }

    if (port < 1024 || port > 65535) {
      return res.status(400).json({ error: 'Port must be between 1024 and 65535' });
    }

    if (sessionTimeout < 5 || sessionTimeout > 480) {
      return res.status(400).json({ error: 'Session timeout must be between 5 and 480 minutes' });
    }

    const config = { port, sessionTimeout };
    await saveAppConfig(config);
    
    res.json({ 
      success: true, 
      message: 'App configuration saved successfully. Server will restart automatically.' 
    });
  } catch (error) {
    console.error('Error saving app config:', error);
    res.status(500).json({ error: 'Failed to save app configuration' });
  }
});

// Restart server with new configuration
router.post('/restart', async (req, res) => {
  try {
    const { port } = req.body;
    
    if (port && (port < 1024 || port > 65535)) {
      return res.status(400).json({ error: 'Port must be between 1024 and 65535' });
    }

    // Import the restart function dynamically to avoid circular dependency
    const { restartServer } = await import('../index.js');
    
    // Send response first, then restart
    res.json({ 
      success: true, 
      message: `Server restart initiated${port ? ` on port ${port}` : ''}` 
    });

    // Restart server after a short delay to allow response to be sent
    setTimeout(async () => {
      try {
        await restartServer(port);
      } catch (error) {
        console.error('Failed to restart server:', error);
      }
    }, 1000);

  } catch (error) {
    console.error('Error restarting server:', error);
    res.status(500).json({ error: 'Failed to restart server' });
  }
});

export default router;
