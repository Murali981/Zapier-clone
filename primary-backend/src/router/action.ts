import { Router } from "express";
import { prismaClient } from "../db";

const router = Router();

/// route ->  /api/v1/trigger/available

router.get("/available", async (req, res) => {
  const availableActions = await prismaClient.availableAction.findMany({});
  res.json({
    availableActions,
  });
});

export const actionRouter = router;
