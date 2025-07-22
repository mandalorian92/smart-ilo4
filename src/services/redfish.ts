import fetch from "node-fetch";
import base64 from "base-64";
import { ILO_HOST, ILO_USERNAME, ILO_PASSWORD } from "../config/env.js";
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
  const url = `https://${ILO_HOST}/redfish/v1/chassis/1/Thermal/`;
  const headers = {
    'Authorization': `Basic ${base64.encode(`${ILO_USERNAME}:${ILO_PASSWORD}`)}`,
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