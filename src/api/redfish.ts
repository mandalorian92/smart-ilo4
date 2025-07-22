import { Router } from "express";
import { getThermalData } from "../services/redfish";
const router = Router();

router.get("/thermal", async (_req, res) => {
  try {
    const data = await getThermalData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;