import cron from "node-cron";
import { getSensors, setFanSpeed } from "./ilo.js";

type Sensor = {
  name: string;
  type: string;
  status: string;
  reading: number;
};

let task: cron.ScheduledTask | null = null;

export function startAutomation(thresholds = { low: 30, med: 40 }) {
  stopAutomation();
  task = cron.schedule("*/1 * * * *", async () => {
    try {
      const sensors = (await getSensors()) as Sensor[];
      const temps = sensors
        .filter((s): s is Sensor => !!s && typeof s.reading === "number")
        .map(s => s.reading);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      let speed = 32;
      if (avgTemp > thresholds.low) speed = 60;
      if (avgTemp > thresholds.med) speed = 90;
      await setFanSpeed(speed);
      console.log(`[Automation] Set fan speed to ${speed}% (avgTemp: ${avgTemp})`);
    } catch (e) {
      console.error("[Automation] Error:", e);
    }
  });
}

export function stopAutomation() {
  if (task) task.stop();
  task = null;
}