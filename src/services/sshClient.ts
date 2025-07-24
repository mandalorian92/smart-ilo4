import { NodeSSH } from "node-ssh";
import { getILoConfig } from "./config.js";

export async function runIloCommand(command: string): Promise<string> {
  const config = await getILoConfig();
  
  if (!config) {
    throw new Error("iLO not configured. Please set up iLO connection in Settings.");
  }

  const ssh = new NodeSSH();
  try {
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
    });
    const { stdout, stderr } = await ssh.execCommand(command);
    if (stderr) throw new Error(stderr);
    return stdout;
  } finally {
    ssh.dispose();
  }
}