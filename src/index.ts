import express from "express";
import bodyParser from "body-parser";
import fans from "./api/fans";
import sensors from "./api/sensors";
import automation from "./api/automation";
import redfish from "./api/redfish";
import { PORT } from "./config/env";

const app = express();
app.use(bodyParser.json());

app.use("/fans", fans);
app.use("/sensors", sensors);
app.use("/automation", automation);
app.use("/redfish", redfish);

app.get("/", (_req, res) => {
  res.send("iLO4 Fan Controller API is running.");
});

app.listen(PORT, () => {
  console.log(`iLO4 Fan Controller API running on port ${PORT}`);
});