import { PrismaClient } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";
import { Kafka } from "kafkajs";
import { parse } from "./parser";

const prismaClient = new PrismaClient();

const TOPIC_NAME = "zap-events";

const kafka = new Kafka({
  clientId: "outbox-processor",
  brokers: ["localhost:9092"], // We are running our kafka queue on localhost:9092
});

async function main() {
  const producer = await kafka.producer();
  await producer.connect();
  const consumer = await kafka.consumer({
    groupId: "main-worker",
  });
  await consumer.connect();
  await consumer.subscribe({
    topic: TOPIC_NAME,
    fromBeginning: true,
  });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message?.value?.toString(),
      });

      if (!message.value?.toString()) {
        return;
      }

      const parsedValue = JSON.parse(message?.value?.toString());

      const zapRunId = parsedValue.zapRunId;

      const stage = parsedValue.stage;

      const zapRunDetails = await prismaClient.zapRun.findFirst({
        where: {
          id: zapRunId,
        },
        include: {
          zap: {
            include: {
              actions: {
                include: {
                  type: true,
                },
              },
            },
          },
        },
      });

      ///////// SUMMARY OF zapRunDetails ////////////////////////////////////////////////////
      /*  ZapRun database in the prisma contains zapRunId along witt the Zap associated with it which is the zapId and the metadata 
       associated with the zapRun But if you see it has also has a relation to the Zap table where the zapId is the foreign key to the 
        relation (or) table Zap , So i can say that in the above "zapRunDetails" query , please include the "zap" as well but not just the
         Zap but the actions that are present in the Zap table . So we are saying that please include the "actions:true" as well   */

      const currentAction = zapRunDetails?.zap.actions.find(
        (x) => x.sortingOrder === stage
      );

      if (!currentAction) {
        console.log("Current action not found");
        return;
      }

      // console.log(currentAction);
      const zapRunMetadata = zapRunDetails?.metadata; //{comment:{email:"harkirat@gmail.com"}}
      if (currentAction.type.id === "email") {
        // Parse out the email , body to send

        const body = parse(
          (currentAction.metadata as JsonObject)?.body as string,
          zapRunMetadata
        ); // You just received {comment.amount}
        const to = parse(
          (currentAction.metadata as JsonObject)?.email as string,
          zapRunMetadata
        ); // {comment.email}
        console.log(`Sending out the email to ${to} body is ${body}`);
      }

      if (currentAction.type.id === "send-sol") {
        // Parse out the amount , address to send
        const amount = parse(
          (currentAction.metadata as JsonObject)?.amount as string,
          zapRunMetadata
        ); // You just received {comment.amount}
        const address = parse(
          (currentAction.metadata as JsonObject)?.address as string,
          zapRunMetadata
        ); // {comment.email}
        console.log(`Sending out SOL of ${amount} to address ${address}`);
      }

      //// We are waiting here for 5 milli seconds
      await new Promise((r) => setTimeout(r, 5000));

      const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1; // Total no of actions - 1 is the last stage because in the sortingOrder
      // starts from 0 and goes upto 1

      if (lastStage !== stage) {
        await producer.send({
          topic: TOPIC_NAME,
          messages: [
            {
              value: JSON.stringify({
                stage: stage + 1,
                zapRunId,
              }),
            },
          ],
        });
      }

      console.log("Processing done");

      await consumer.commitOffsets([
        {
          topic: TOPIC_NAME,
          partition: partition,
          offset: (parseInt(message.offset) + 1).toString(),
        },
      ]);
    },
  });
}

main();
