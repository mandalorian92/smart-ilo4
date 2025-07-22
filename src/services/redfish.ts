import fetch from "node-fetch";
import base64 from "base-64";
import { ILO_HOST, ILO_USERNAME, ILO_PASSWORD } from "../config/env.js";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function getThermalData() {
  const url = `https://${ILO_HOST}/redfish/v1/chassis/1/Thermal/`;
  const headers = {
    Authorization: "Basic " + base64.encode(`${ILO_USERNAME}:${ILO_PASSWORD}`),
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    agent,
  });

  if (!res.ok) {
    throw new Error(`Redfish API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}