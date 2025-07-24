import fs from 'fs/promises';
import path from 'path';

interface AppConfig {
  port: number;
  sessionTimeout: number;
}

interface AppConfigFile extends AppConfig {
  lastUpdated?: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'config', 'app-config.json');

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  port: 8443,
  sessionTimeout: 30
};

// Ensure config directory exists
async function ensureConfigDir() {
  const configDir = path.dirname(CONFIG_FILE);
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

// Get current app configuration
export async function getAppConfig(): Promise<AppConfig> {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config: AppConfigFile = JSON.parse(data);
    
    // Return only the required fields, use defaults if missing
    return {
      port: config.port || DEFAULT_CONFIG.port,
      sessionTimeout: config.sessionTimeout || DEFAULT_CONFIG.sessionTimeout
    };
  } catch (error) {
    // If file doesn't exist or is corrupted, return defaults
    console.log('App config file not found or corrupted, using defaults');
    return DEFAULT_CONFIG;
  }
}

// Save app configuration
export async function saveAppConfig(config: AppConfig): Promise<void> {
  await ensureConfigDir();
  
  const configToSave: AppConfigFile = {
    ...config,
    lastUpdated: new Date().toISOString()
  };
  
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2), 'utf-8');
  console.log('App configuration saved:', configToSave);
}

// Get the current port from config (used by server startup)
export async function getCurrentPort(): Promise<number> {
  try {
    const config = await getAppConfig();
    return config.port;
  } catch (error) {
    console.error('Error getting current port, using default:', error);
    return DEFAULT_CONFIG.port;
  }
}
