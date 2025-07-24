import fs from 'fs/promises';
import path from 'path';
import { ILO_HOST, ILO_USERNAME, ILO_PASSWORD } from '../config/env.js';

interface ILoConfig {
  host: string;
  username: string;
  password: string;
}

const CONFIG_FILE = path.join(process.cwd(), 'config', 'ilo-config.json');

// Ensure config directory exists
async function ensureConfigDir() {
  const configDir = path.dirname(CONFIG_FILE);
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

// Get current iLO configuration
export async function getILoConfig(): Promise<ILoConfig | null> {
  try {
    // First try to read from file
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, try environment variables
    if (ILO_HOST && ILO_USERNAME && ILO_PASSWORD) {
      return {
        host: ILO_HOST,
        username: ILO_USERNAME,
        password: ILO_PASSWORD
      };
    }
    // No configuration available
    return null;
  }
}

// Save iLO configuration
export async function saveILoConfig(config: ILoConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// Test iLO connection
export async function testILoConnection(config: ILoConfig): Promise<boolean> {
  try {
    const { NodeSSH } = await import('node-ssh');
    const ssh = new NodeSSH();
    
    await ssh.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      algorithms: { 
        kex: ["diffie-hellman-group14-sha1"],
        serverHostKey: ["ssh-rsa"],
        cipher: ["aes128-cbc", "3des-cbc"],
        hmac: ["hmac-sha1"]
      },
      readyTimeout: 10000, // 10 second timeout
    });
    
    // Try a simple command to verify access
    const { stdout, stderr } = await ssh.execCommand('version');
    ssh.dispose();
    
    return !stderr && stdout.length > 0;
  } catch (error) {
    console.error('iLO connection test failed:', error);
    return false;
  }
}

// Check if iLO is configured
export async function isILoConfigured(): Promise<boolean> {
  const config = await getILoConfig();
  return config !== null && !!config.host && !!config.username && !!config.password;
}
