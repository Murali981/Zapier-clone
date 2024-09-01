import { Router } from "express";
import { authMiddleware } from "./middlware";
import { SigninSchema, SignupSchema } from "../types";
import { prismaClient } from "../db";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";

const router = Router();

/// route ->  /api/v1/trigger/available

router.get("/available", async (req, res) => {
  const availableTriggers = await prismaClient.availableTrigger.findMany({});
  res.json({
    availableTriggers,
  });
});

export const triggerRouter = router;
