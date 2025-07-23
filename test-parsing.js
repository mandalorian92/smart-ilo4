// Test the parsing logic with the actual command outputs

const sampleOutputs = {
  system1: `</>hpiLO-> show system1
 Properties
    name=ProLiant ML350e Gen8 v2
    number=AUD4250GTV`,
    
  systemFirmware1: `</>hpiLO-> show system1/firmware1
/system1/firmware1
  Targets
  Properties
    version=J02
    date=05/24/2019`,
    
  mapFirmware1: `</>hpiLO-> show /map1/firmware1
/map1/firmware1
  Targets
  Properties
    version=2.77
    date=Dec 07 2020
    name=iLO 4`
};

function parseValue(output, key) {
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith(key)) {
      // Extract everything after the key, handling multi-word values
      const value = trimmedLine.substring(key.length).trim();
      // Remove quotes if present and return the full value
      return value.replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

function parseDate(output, key) {
  const lines = output.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith(key)) {
      // Extract everything after the key for date parsing
      const value = trimmedLine.substring(key.length).trim();
      // Remove quotes if present and return the full date value
      return value.replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

// Test parsing
console.log("Testing parsing with sample outputs...");

const model = parseValue(sampleOutputs.system1, "name=");
const serialNumber = parseValue(sampleOutputs.system1, "number=");
const iloGeneration = parseValue(sampleOutputs.mapFirmware1, "name=");

const systemRomVersion = parseValue(sampleOutputs.systemFirmware1, "version=");
const systemRomDate = parseDate(sampleOutputs.systemFirmware1, "date=");
const systemRom = systemRomVersion && systemRomDate 
  ? `${systemRomVersion} (${systemRomDate})`
  : systemRomVersion || systemRomDate || "Unknown";

const iloFirmwareVersion = parseValue(sampleOutputs.mapFirmware1, "version=");
const iloFirmwareDate = parseDate(sampleOutputs.mapFirmware1, "date=");
const iloFirmware = iloFirmwareVersion && iloFirmwareDate 
  ? `${iloFirmwareVersion} (${iloFirmwareDate})`
  : iloFirmwareVersion || iloFirmwareDate || "Unknown";

console.log("\nParsed results:");
console.log("Model:", model);
console.log("Serial Number:", serialNumber);
console.log("iLO Generation:", iloGeneration);
console.log("System ROM:", systemRom);
console.log("iLO Firmware:", iloFirmware);

console.log("\nExpected results:");
console.log("Model: ProLiant ML350e Gen8 v2");
console.log("Serial Number: AUD4250GTV");
console.log("iLO Generation: iLO 4");
console.log("System ROM: J02 (05/24/2019)");
console.log("iLO Firmware: 2.77 (Dec 07 2020)");
