// Serve frontend static files
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import sensorsRouter from "./api/sensors.js";
import fansRouter from "./api/fans.js";
import redfishRouter from "./api/redfish.js";
import automationRouter from "./api/automation.js";
import systemInfoRouter from "./api/systemInfo.js";
import powerRouter from "./api/power.js";
import configRouter from "./api/config.js";
import appConfigRouter from "./api/appConfig.js";
import systemLogRouter from "./api/systemLog.js";
import statusRouter from "./api/status.js";
import debugRouter from "./api/debug.js";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

app.get("/api", (_req, res) => {
  res.send("<h1>iLO4 Fan Controller API is running.</h1>");
});

// Register API routes
app.use("/sensors", sensorsRouter);
app.use("/fans", fansRouter);
app.use("/redfish", redfishRouter);
app.use("/automation", automationRouter);
app.use("/api/system", systemInfoRouter);
app.use("/api/ilo", configRouter);
app.use("/api/app", appConfigRouter);
app.use("/api/power", powerRouter);
app.use("/api/systemlog", systemLogRouter);
app.use("/api/status", statusRouter);
app.use("/api/debug", debugRouter);

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, "../frontend/build")));

// For any other route, serve index.html (for React Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

export default app;