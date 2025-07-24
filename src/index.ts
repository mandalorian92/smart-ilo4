import { Server } from 'http';
import app from './app.js';
import { getCurrentPort } from './services/appConfig.js';

let server: Server | null = null;
let currentPort: number;

// Use configured port, fallback to environment variable, then default
const getPort = async () => {
  const configuredPort = await getCurrentPort();
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  
  // Priority: configured port > environment variable > default (handled by getCurrentPort)
  return envPort || configuredPort;
};

const startServer = async (port?: number): Promise<Server> => {
  const PORT = port || await getPort();
  currentPort = PORT;
  
  return new Promise((resolve, reject) => {
    const newServer = app.listen(PORT, () => {
      console.log(`iLO4 Fan Controller API is running on port ${PORT}`);
      console.log(`Access the web interface at: https://localhost:${PORT}`);
      resolve(newServer);
    });
    
    newServer.on('error', (error) => {
      console.error('Server error:', error);
      reject(error);
    });
  });
};

const stopServer = async (): Promise<void> => {
  if (server) {
    return new Promise((resolve) => {
      server!.close(() => {
        console.log('Server stopped gracefully');
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

// Initial server start
const initializeServer = async () => {
  try {
    server = await startServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

initializeServer();