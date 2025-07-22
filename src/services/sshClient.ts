import { NodeSSH } from "node-ssh";
import { ILO_HOST, ILO_USERNAME, ILO_PASSWORD } from "../config/env.js";

export async function runIloCommand(command: string): Promise<string> {
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: ILO_HOST,
      username: ILO_USERNAME,
      password: ILO_PASSWORD,
      algorithms: { kex: ["diffie-hellman-group14-sha1"] },
    });
    const { stdout, stderr } = await ssh.execCommand(command);
    if (stderr) throw new Error(stderr);
    return stdout;
  } finally {
    ssh.dispose();
  }
}