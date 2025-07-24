import fetch from "node-fetch";
import base64 from "base-64";
import { getILoConfig } from "./config.js";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

interface RedfishFan {
  CurrentReading: number;
  FanName: string;
  Status: {
    Health?: string;
    State: string;
  };
  Units: string;
}

interface RedfishTemperature {
  CurrentReading: number;
  Name: string;
  Number: number;
  PhysicalContext: string;
  ReadingCelsius: number;
  Status: {
    Health?: string;
    State: string;
  };
  Units: string;
  UpperThresholdCritical?: number;
  UpperThresholdFatal?: number;
}

interface RedfishThermalResponse {
  Fans: RedfishFan[];
  Temperatures: RedfishTemperature[];
}

export async function getThermalData(): Promise<RedfishThermalResponse> {
  const config = await getILoConfig();
  
  if (!config) {
    throw new Error("iLO not configured. Please set up iLO connection in Settings.");
  }

  const url = `https://${config.host}/redfish/v1/chassis/1/Thermal/`;
  const headers = {
    'Authorization': `Basic ${base64.encode(`${config.username}:${config.password}`)}`,
    'Accept': 'application/json',
    'User-Agent': 'Smart-iLO4-Controller'
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      agent
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as RedfishThermalResponse;
    return data;
  } catch (error) {
    console.error('Failed to fetch thermal data from iLO:', error);
    throw error;
  }
}