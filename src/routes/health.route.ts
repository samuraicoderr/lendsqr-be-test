import { Router } from "express";
import { db } from "../db/knex";

const router = Router();

router.get("/", async (req, res) => {
  try {
    await db("users").select("id").limit(1);

    res.status(200).json({
      status: "ok",
      database: "ok",
      message: "Wallet service is running",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "unavailable",
      message: "Wallet service database check failed",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
