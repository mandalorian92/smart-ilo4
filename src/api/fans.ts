import { Router } from "express";
import { getFans } from "../services/ilo";

const router = Router();

// GET /fans — current fan speeds
router.get("/", async (_req, res) => {
  try {
    const fans = await getFans();
    res.json(fans);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;