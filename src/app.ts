import express from "express";
import cors from "cors";
import sensorsRouter from "./api/sensors";
import fansRouter from "./api/fans";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("<h1>iLO4 Fan Controller API is running.</h1>");
});

// Register API routes
app.use("/sensors", sensorsRouter);
app.use("/fans", fansRouter);

export default app;