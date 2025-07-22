import { Router } from "express";
import { startAutomation, stopAutomation } from "../services/automation.js";
const router = Router();

router.post("/start", (req, res) => {
  startAutomation(req.body.thresholds);
  res.json({ ok: true });
});

router.post("/stop", (_req, res) => {
  stopAutomation();
  res.json({ ok: true });
});

export default router;