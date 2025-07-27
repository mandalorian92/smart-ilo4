import { NodeSSH } from "node-ssh";
import { getILoConfig } from "./config.js";

interface SSHConnection {
  ssh: NodeSSH;
  lastUsed: number;
  isConnected: boolean;
  host: string;
}

class SSHConnectionPool {
  private connections: Map<string, SSHConnection> = new Map();
  private readonly MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly CONNECTION_TIMEOUT = 20000; // 20 seconds
  private readonly COMMAND_TIMEOUT = 25000; // 25 seconds
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to close idle connections
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute
  }

  private getConnectionKey(config: { host: string; username: string }): string {
    return `${config.host}:${config.username}`;
  }

  private async createConnection(config: { host: string; username: string; password: string }): Promise<NodeSSH> {
    const ssh = new NodeSSH();
    
    console.log(`Creating new SSH connection to ${config.host}...`);
    
    await ssh.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      readyTimeout: this.CONNECTION_TIMEOUT,
      algorithms: { 
        kex: ["diffie-hellman-group14-sha1"],
        serverHostKey: ["ssh-rsa"],
        cipher: ["aes128-cbc", "3des-cbc"],
        hmac: ["hmac-sha1"]
      },
    });

    console.log(`SSH connection established to ${config.host}`);
    return ssh;
  }

  private async getConnection(config: { host: string; username: string; password: string }): Promise<NodeSSH> {
    const key = this.getConnectionKey(config);
    const existing = this.connections.get(key);

    // Check if we have a valid existing connection
    if (existing && existing.isConnected && existing.ssh.isConnected()) {
      console.log(`Reusing existing SSH connection to ${config.host}`);
      existing.lastUsed = Date.now();
      return existing.ssh;
    }

    // Clean up old connection if it exists
    if (existing) {
      console.log(`Cleaning up old SSH connection to ${config.host}`);
      try {
        existing.ssh.dispose();
      } catch (error) {
        console.warn('Error disposing old SSH connection:', error);
      }
      this.connections.delete(key);
    }

    // Create new connection
    const ssh = await this.createConnection(config);
    
    // Store the connection
    this.connections.set(key, {
      ssh,
      lastUsed: Date.now(),
      isConnected: true,
      host: config.host
    });

    return ssh;
  }

  async executeCommand(command: string): Promise<string> {
    const config = await getILoConfig();
    
    if (!config) {
      throw new Error("iLO not configured. Please set up iLO connection in Settings.");
    }

    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const ssh = await this.getConnection(config);
        
        console.log(`Executing SSH command on ${config.host}: ${command}`);
        
        const { stdout, stderr } = await ssh.execCommand(command, {
          execOptions: { timeout: this.COMMAND_TIMEOUT }
        });
        
        if (stderr) {
          console.warn(`SSH command stderr on ${config.host}:`, stderr);
          throw new Error(stderr);
        }
        
        console.log(`SSH command completed successfully on ${config.host}`);
        return stdout;
        
      } catch (error: any) {
        retries++;
        const key = this.getConnectionKey(config);
        const connection = this.connections.get(key);
        
        // Mark connection as disconnected
        if (connection) {
          connection.isConnected = false;
        }

        console.error(`SSH command failed on ${config.host} (attempt ${retries}/${maxRetries + 1}):`, error.message);
        
        if (retries > maxRetries) {
          throw new Error(`SSH command failed after ${maxRetries + 1} attempts: ${error.message}`);
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Retrying SSH command on ${config.host}...`);
      }
    }

    throw new Error('Maximum retries exceeded');
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (const [key, connection] of this.connections.entries()) {
      if (now - connection.lastUsed > this.MAX_IDLE_TIME) {
        console.log(`Cleaning up idle SSH connection to ${connection.host}`);
        try {
          connection.ssh.dispose();
        } catch (error) {
          console.warn(`Error disposing SSH connection to ${connection.host}:`, error);
        }
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => this.connections.delete(key));
  }

  async closeAllConnections(): Promise<void> {
    console.log('Closing all SSH connections...');
    
    for (const [key, connection] of this.connections.entries()) {
      try {
        connection.ssh.dispose();
        console.log(`Closed SSH connection to ${connection.host}`);
      } catch (error) {
        console.warn(`Error closing SSH connection to ${connection.host}:`, error);
      }
    }
    
    this.connections.clear();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  getConnectionStats(): { total: number; connected: number; hosts: string[] } {
    let connected = 0;
    const hosts: string[] = [];
    
    for (const connection of this.connections.values()) {
      hosts.push(connection.host);
      if (connection.isConnected && connection.ssh.isConnected()) {
        connected++;
      }
    }
    
    return {
      total: this.connections.size,
      connected,
      hosts: [...new Set(hosts)]
    };
  }
}

// Create singleton SSH connection pool
const sshPool = new SSHConnectionPool();

// Export the main function that uses the pool
export async function runIloCommand(command: string): Promise<string> {
  return sshPool.executeCommand(command);
}

// Export pool management functions
export async function closeSSHConnections(): Promise<void> {
  return sshPool.closeAllConnections();
}

export function getSSHConnectionStats(): { total: number; connected: number; hosts: string[] } {
  return sshPool.getConnectionStats();
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing SSH connections...');
  await closeSSHConnections();
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing SSH connections...');
  await closeSSHConnections();
});