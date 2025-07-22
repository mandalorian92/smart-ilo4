import { runIloCommand } from "./sshClient";

/** Parses iLO sensor output into objects */
function parseSensors(raw: string) {
  return raw.split("\n")
    .map(line => {
      const parts = line.split("|").map(x => x.trim());
      return parts.length >= 4 ? {
        name: parts[0],
        type: parts[1],
        status: parts[2],
        reading: parseFloat(parts[3]),
      } : null;
    })
    .filter(Boolean)
    .filter(obj => obj!.name && !isNaN(obj!.reading));
}

export async function getSensors() {
  const result = await runIloCommand("show sensors");
  return parseSensors(result);
}

export async function setFanSpeed(percent: number, fanIds: number[] = [0,1,2,3,4,5]) {
  const value = Math.round((percent / 100) * 255);
  for (const fanId of fanIds) {
    await runIloCommand(`fan p ${fanId} lock ${value}`);
  }
}

export async function unlockFans() {
  await runIloCommand("fan p global unlock");
}