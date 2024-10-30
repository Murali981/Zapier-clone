import * as dotenv from "dotenv";
dotenv.config();
import { Kafka } from "kafkajs";
import { sendEmail } from "./email";
import { sendSol } from "./solana";

const TOPIC_NAME = "github-bounty-events"; // Same as processor's topic

const kafka = new Kafka({
  clientId: "github-bounty-worker",
  brokers: ["localhost:9092"],
});

async function main() {
  const consumer = kafka.consumer({ groupId: "github-bounty-worker-group" });
  await consumer.connect();

  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      });

      if (!message.value?.toString()) {
        return;
      }

      try {
        // Parse the bounty details from Kafka message
        const bountyData = JSON.parse(message.value.toString());

        // First send SOL
        console.log(
          `Sending ${bountyData.amount} SOL to ${bountyData.recipientAddress}`
        );
        await sendSol(
          bountyData.recipientAddress,
          bountyData.amount.toString()
        );

        // Then send confirmation email
        const emailBody = `We have dispensed a bounty of ${bountyData.amount} SOL to your address ${bountyData.recipientAddress}`;
        console.log(`Sending email to ${bountyData.recipientEmail}`);
        await sendEmail(bountyData.recipientEmail, emailBody);

        console.log("Bounty processing completed");

        // Commit the offset after successful processing
        await consumer.commitOffsets([
          {
            topic: TOPIC_NAME,
            partition,
            offset: (parseInt(message.offset) + 1).toString(),
          },
        ]);
      } catch (error) {
        console.error("Error processing bounty:", error);
        // Here you might want to implement retry logic or
        // store failed bounties in a separate table
      }
    },
  });
}

// Add error handling for the main function
main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
