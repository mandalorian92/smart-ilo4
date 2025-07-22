import { Router } from "express";
import { getSensors } from "../services/ilo";
const router = Router();

router.get("/", async (_req, res) => {
  try {
    const sensors = await getSensors();
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;