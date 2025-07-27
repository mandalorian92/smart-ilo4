import { Router } from 'express';
import { centralizedDataFetcher } from '../services/centralizedDataFetcher.js';
import { isILoConfigured } from '../services/config.js';
import { getSSHConnectionStats } from '../services/sshClient.js';

const router = Router();

// Get system status
router.get('/', async (_req, res) => {
  try {
    const configured = await isILoConfigured();
    const fetcherRunning = centralizedDataFetcher.isRunning();
    const sshStats = getSSHConnectionStats();
    
    const systemLogsResult = centralizedDataFetcher.getSystemLogs();
    const powerInfoResult = centralizedDataFetcher.getPowerInfo();
    const systemInfoResult = centralizedDataFetcher.getSystemInfo();
    
    res.json({
      iloConfigured: configured,
      centralizedFetcherRunning: fetcherRunning,
      lastDataUpdate: systemLogsResult.lastUpdated,
      sshConnections: {
        total: sshStats.total,
        connected: sshStats.connected,
        hosts: sshStats.hosts
      },
      dataStatus: {
        systemLogs: {
          available: systemLogsResult.data.length > 0,
          error: systemLogsResult.error,
          count: systemLogsResult.data.length
        },
        powerInfo: {
          available: !!powerInfoResult.data,
          error: powerInfoResult.error
        },
        systemInfo: {
          available: !!systemInfoResult.data,
          error: systemInfoResult.error
        }
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

export default router;
