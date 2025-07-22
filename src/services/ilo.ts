// This file holds the logic for sensors, fans, overrides, and history collection.

type Sensor = {
  name: string;
  type: string;
  status: string;
  reading: number;
};
type Fan = {
  name: string;
  speed: number;
};

let sensorOverrides: Record<string, number> = {};
let history: { time: string; avgTemp: number }[] = [];

// Dummy in-memory sensors and fans
let sensors: Sensor[] = [
  { name: "CPU Temp", type: "temp", status: "OK", reading: 32 },
  { name: "System Temp", type: "temp", status: "OK", reading: 29 }
];
let fans: Fan[] = [
  { name: "Fan 1", speed: 60 },
  { name: "Fan 2", speed: 60 }
];

// Simulate updates every minute
setInterval(() => {
  // Simulate changing readings
  sensors.forEach(s => {
    let base = s.name === "CPU Temp" ? 32 : 29;
    s.reading = base + Math.floor(Math.random() * 6); // random fluctuation
    if (sensorOverrides[s.name] !== undefined) {
      s.reading = sensorOverrides[s.name];
    }
  });
  // Calculate avgTemp
  const avgTemp = sensors.reduce((a, b) => a + b.reading, 0) / sensors.length;
  history.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), avgTemp });
  // Keep only last 60 samples (1hr, 1/min)
  if (history.length > 60) history.shift();
}, 60 * 1000);

// Populate initial history (60 samples)
(() => {
  let now = Date.now();
  for (let i = 59; i >= 0; i--) {
    let t = new Date(now - i * 60000);
    const avgTemp = sensors.reduce((a, b) => a + b.reading, 0) / sensors.length;
    history.push({ time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), avgTemp });
  }
})();

export async function getSensors(): Promise<Sensor[]> {
  // Apply overrides
  return sensors.map(s => ({
    ...s,
    reading: sensorOverrides[s.name] ?? s.reading
  }));
}

export async function getFans(): Promise<Fan[]> {
  return fans;
}

export function overrideSensor(sensorId: string, value: number) {
  sensorOverrides[sensorId] = value;
}

export function resetSensorOverrides() {
  sensorOverrides = {};
}

export function getSensorHistory() {
  return history;
}

export async function setFanSpeed(speed: number) {
  // For demo: Set all fans to this speed
  fans.forEach(f => { f.speed = speed; });
}