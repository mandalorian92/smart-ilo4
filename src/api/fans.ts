import { Router } from "express";
import { setFanSpeed, unlockFans } from "../services/ilo";
const router = Router();

router.post("/set", async (req, res) => {
  const { speed } = req.body;
  try {
    await setFanSpeed(Number(speed));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/unlock", async (_req, res) => {
  try {
    await unlockFans();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;