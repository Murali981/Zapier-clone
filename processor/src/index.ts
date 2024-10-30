import { PrismaClient } from "@prisma/client";
import { Kafka, Producer } from "kafkajs";

const TOPIC_NAME = "github-bounty-events";
const client = new PrismaClient();

const kafka = new Kafka({
  clientId: "github-bounty-processor",
  brokers: ["localhost:9092"],
});

async function processGithubBounties(producer: Producer) {
  try {
    // Get all pending bounties (no need for take: 10)
    const pendingBounties = await client.githubBountyOutbox.findMany({
      include: {
        bountyRun: true, // Include associated bounty details
      },
    });

    if (pendingBounties.length === 0) {
      return;
    }

    console.log("Found pending bounties:", pendingBounties);

    // Send to Kafka (no stages needed)
    const result = await producer.send({
      topic: TOPIC_NAME,
      messages: pendingBounties.map((bounty) => ({
        value: JSON.stringify({
          bountyRunId: bounty.bountyRunId,
          amount: bounty.bountyRun.amount,
          recipientAddress: bounty.bountyRun.recipientAddress,
          recipientEmail: bounty.bountyRun.recipientEmail,
        }),
      })),
    });

    console.log("Bounty messages sent to Kafka:", result);

    // Clear the outbox after processing
    await client.githubBountyOutbox.deleteMany({
      where: {
        id: {
          in: pendingBounties.map((x) => x.id),
        },
      },
    });

    console.log("Cleared outbox entries");
  } catch (error) {
    console.error("Error processing GitHub bounties:", error);
  }
}

async function main() {
  const producer = kafka.producer();

  try {
    await producer.connect();
    console.log("Producer connected to Kafka");

    const admin = kafka.admin();
    await admin.createTopics({
      topics: [{ topic: TOPIC_NAME, numPartitions: 1 }],
      waitForLeaders: true,
    });

    while (true) {
      await processGithubBounties(producer);
      await new Promise((r) => setTimeout(r, 3000));
    }
  } catch (error) {
    console.error("Fatal error:", error);
    await producer.disconnect();
    process.exit(1);
  }
}

main();
