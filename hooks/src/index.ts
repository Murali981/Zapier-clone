import express from "express";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const app = express();

app.use(express.json());

// https://hooks.zapier.com/hooks/catch/17043103/22b8496/ => This is a sample zapier webhook end point that we got from official zapier website
// In the below post end point we should have a password logic that allows only some users are allowed to hit the below end point but not all the
// users
app.post("/hooks/catch/:userId/:zapId", async (req, res) => {
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;

  /// whatever the trigger that is happened after hitting the above post end point that trigger has to be Stored in my Database.
  await client.$transaction(async (tx) => {
    const run = await tx.zapRun.create({
      data: {
        zapId: zapId,
        metadata: body,
      },
    });

    await tx.zapRunOutbox.create({
      data: {
        zapRunId: run.id,
      },
    });
  });

  res.json({
    message: "Webook has been received",
  });

  /// Then push it on to a queue(most probably KAFKA/REDIS)
});

app.listen(3000);
