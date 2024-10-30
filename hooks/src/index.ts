import express from "express";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

const app = express();

app.use(express.json());

app.post("/github-webhook", async (req, res) => {
  try {
    console.log("Full webhook payload:", JSON.stringify(req.body, null, 2));
    // This will show us the exact structure

    const body = req.body;
    // GitHub's webhook payload typically looks like:
    /*
    {
      "action": "created",
      "issue": {
        "number": 1,
        "title": "Testing the webhook automation",
        "user": {
          "login": "Murali981",
          // more user details...
        },
        // more issue details...
      },
      "comment": {
        "id": 123456789,
        "body": "{ \"comment\":{ \"amount\":0.00001, \"address\":\"CARBKXQKDzXTeKRX457wTRMCAbg3uYBfkQGiGLtWgqLD\", \"email\":\"josephstalin981@gmail.com\" } }",
        "user": {
          "login": "Murali981",
          // more user details...
        },
        "created_at": "2024-10-29T12:00:00Z",
        // more comment details...
      },
      "repository": {
        "name": "Zapier-clone",
        "full_name": "Murali981/Zapier-clone",
        // more repository details...
      },
      "sender": {
        "login": "Murali981",
        // more sender details...
      }
    }
    */
    const commentData = JSON.parse(body.comment.body);
    const bountyDetails = commentData.comment;

    await client.$transaction(async (tx) => {
      const bountyRun = await tx.githubBountyRun.create({
        data: {
          amount: bountyDetails.amount,
          recipientAddress: bountyDetails.address,
          recipientEmail: bountyDetails.email,
        },
      });

      await tx.githubBountyOutbox.create({
        data: {
          bountyRunId: bountyRun.id,
        },
      });
    });

    res.json({
      message: "GitHub bounty has been queued",
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3003, () => {
  console.log("This port is running on 3003");
});
