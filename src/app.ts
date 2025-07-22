// Serve frontend static files
import path from "path";
import express from "express";
import cors from "cors";
import sensorsRouter from "./api/sensors.js";
import fansRouter from "./api/fans.js";
import redfishRouter from "./api/redfish.js";
import automationRouter from "./api/automation.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("<h1>iLO4 Fan Controller API is running.</h1>");
});

// Register API routes
app.use("/sensors", sensorsRouter);
app.use("/fans", fansRouter);
app.use("/redfish", redfishRouter);
app.use("/automation", automationRouter);

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, "../frontend/build")));

// For any other route, serve index.html (for React Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

export default app;