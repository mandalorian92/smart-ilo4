import { Server } from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import app from './app.js';
import { getCurrentPort } from './services/appConfig.js';
import { centralizedDataFetcher } from './services/centralizedDataFetcher.js';
import { isILoConfigured } from './services/config.js';
// Initialize log capture service
import './services/logger.js';

let server: Server | https.Server | null = null;
let currentPort: number;

// Use configured port, fallback to environment variable, then default
const getPort = async () => {
  const configuredPort = await getCurrentPort();
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  
  // Priority: configured port > environment variable > default (handled by getCurrentPort)
  return envPort || configuredPort;
};

// Check for SSL certificates
const getSSLOptions = () => {
  try {
    const keyPath = path.join(process.cwd(), 'ssl', 'private.key');
    const certPath = path.join(process.cwd(), 'ssl', 'certificate.crt');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
    }
  } catch (error) {
    console.log('SSL certificates not found, using HTTP');
  }
  return null;
};

const startServer = async (port?: number): Promise<Server | https.Server> => {
  const PORT = port || await getPort();
  currentPort = PORT;
  
  const sslOptions = getSSLOptions();
  
  return new Promise((resolve, reject) => {
    if (sslOptions) {
      console.log('Starting HTTPS server...');
      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(PORT, () => {
        console.log(`iLO4 Fan Controller API is running on HTTPS port ${PORT}`);
        console.log(`Access the web interface at: https://localhost:${PORT}`);
        console.log('🔒 HTTPS enabled - secure authentication with bcrypt');
        resolve(httpsServer);
      });
      
      httpsServer.on('error', (error) => {
        console.error('HTTPS server error:', error);
        reject(error);
      });
    } else {
      console.log('Starting HTTP server...');
      const httpServer = app.listen(PORT, () => {
        console.log(`iLO4 Fan Controller API is running on HTTP port ${PORT}`);
        console.log(`Access the web interface at: http://localhost:${PORT}`);
        console.log('⚠️  HTTP mode - for production, add SSL certificates to /ssl directory');
        resolve(httpServer);
      });
      
      httpServer.on('error', (error) => {
        console.error('HTTP server error:', error);
        reject(error);
      });
    }
  });
};

const stopServer = async (): Promise<void> => {
  if (server) {
    return new Promise((resolve) => {
      server!.close(() => {
        console.log('Server stopped gracefully');
        centralizedDataFetcher.stop(); // Stop the data fetcher
        resolve();
      });
    });
  }
};

export const restartServer = async (newPort?: number): Promise<void> => {
  console.log('Restarting server...');
  
  // Stop current server
  await stopServer();
  
  // Start new server
  server = await startServer(newPort);
  
  console.log(`Server restarted successfully on port ${currentPort}`);
};

export const getCurrentServerPort = (): number => currentPort;

// Initial server start and data fetcher initialization
const initializeServer = async () => {
  try {
    server = await startServer();
    
    // Initialize centralized data fetcher if iLO is configured
    try {
      const configured = await isILoConfigured();
      if (configured) {
        console.log('iLO is configured, starting centralized data fetcher...');
        centralizedDataFetcher.start();
        console.log('Centralized data fetcher started on server startup');
      } else {
        console.log('iLO not yet configured, centralized data fetcher will start after setup completion');
      }
    } catch (error) {
      console.error('Error checking iLO configuration status:', error);
    }
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

initializeServer();