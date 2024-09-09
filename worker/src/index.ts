// require("dotenv").config();

// import { PrismaClient } from "@prisma/client";
// import { JsonObject } from "@prisma/client/runtime/library";
// import { Kafka } from "kafkajs";
// import { parse } from "./parser";
// import { sendEmail } from "./email";
// import { sendSol } from "./solana";

// const prismaClient = new PrismaClient();

// const TOPIC_NAME = "zap-events-2";

// const kafka = new Kafka({
//   clientId: "outbox-processor",
//   brokers: ["localhost:9092"], // We are running our kafka queue on localhost:9092
// });

// async function main() {
//   const producer = await kafka.producer();
//   await producer.connect();
//   const consumer = await kafka.consumer({
//     groupId: "main-worker",
//   });
//   await consumer.connect();
//   await consumer.subscribe({
//     topic: TOPIC_NAME,
//     fromBeginning: true,
//   });

//   await consumer.run({
//     autoCommit: false,
//     eachMessage: async ({ topic, partition, message }) => {
//       console.log({
//         partition,
//         offset: message.offset,
//         value: message?.value?.toString(),
//       });

//       if (!message.value?.toString()) {
//         return;
//       }

//       const parsedValue = JSON.parse(message?.value?.toString());

//       const zapRunId = parsedValue.zapRunId;

//       const stage = parsedValue.stage;

//       const zapRunDetails = await prismaClient.zapRun.findFirst({
//         where: {
//           id: zapRunId,
//         },
//         include: {
//           zap: {
//             include: {
//               actions: {
//                 include: {
//                   type: true,
//                 },
//               },
//             },
//           },
//         },
//       });

//       ///////// SUMMARY OF zapRunDetails ////////////////////////////////////////////////////
//       /*  ZapRun database in the prisma contains zapRunId along witt the Zap associated with it which is the zapId and the metadata
//        associated with the zapRun But if you see it has also has a relation to the Zap table where the zapId is the foreign key to the
//         relation (or) table Zap , So i can say that in the above "zapRunDetails" query , please include the "zap" as well but not just the
//          Zap but the actions that are present in the Zap table . So we are saying that please include the "actions:true" as well   */

//       const currentAction = zapRunDetails?.zap.actions.find(
//         (x) => x.sortingOrder === stage
//       );

//       if (!currentAction) {
//         console.log("Current action not found");
//         return;
//       }

//       // console.log(currentAction);
//       const zapRunMetadata = zapRunDetails?.metadata; //{comment:{email:"harkirat@gmail.com"}}
//       if (currentAction.type.id === "email") {
//         // Parse out the email , body to send

//         const body = parse(
//           (currentAction.metadata as JsonObject)?.body as string,
//           zapRunMetadata
//         ); // You just received {comment.amount}
//         console.log(body);
//         const to = parse(
//           (currentAction.metadata as JsonObject)?.email as string,
//           zapRunMetadata
//         ); // {comment.email}
//         console.log(to);
//         console.log(`Sending out the email to ${to} body is ${body}`);
//         await sendEmail(to, body);
//       }

//       if (currentAction.type.id === "send-sol") {
//         // Parse out the amount , address to send
//         const amount = parse(
//           (currentAction.metadata as JsonObject)?.amount as string,
//           zapRunMetadata
//         ); // You just received {comment.amount}
//         const address = parse(
//           (currentAction.metadata as JsonObject)?.address as string,
//           zapRunMetadata
//         ); // {comment.email}
//         console.log(`Sending out SOL of ${amount} to address ${address}`);
//         await sendSol(address, amount);
//       }

//       //// We are waiting here for 5 milli seconds
//       await new Promise((r) => setTimeout(r, 5000));

//       const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1; // Total no of actions - 1 is the last stage because in the sortingOrder
//       // starts from 0 and goes upto 1

//       if (lastStage !== stage) {
//         await producer.send({
//           topic: TOPIC_NAME,
//           messages: [
//             {
//               value: JSON.stringify({
//                 stage: stage + 1,
//                 zapRunId,
//               }),
//             },
//           ],
//         });
//       }

//       console.log("Processing done");

//       await consumer.commitOffsets([
//         {
//           topic: TOPIC_NAME,
//           partition: partition,
//           offset: (parseInt(message.offset) + 1).toString(),
//         },
//       ]);
//     },
//   });
// }

// main();

require("dotenv").config();

import { PrismaClient } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";
import { Kafka } from "kafkajs";
import { parse } from "./parser";
import { sendEmail } from "./email";
import { sendSol } from "./solana";

const prismaClient = new PrismaClient();
const TOPIC_NAME = "zap-events-3";

const kafka = new Kafka({
  clientId: "outbox-processor-2",
  brokers: ["localhost:9092"],
});

async function main() {
  const consumer = kafka.consumer({ groupId: "main-worker-2" });
  await consumer.connect();
  const producer = kafka.producer();
  await producer.connect();

  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: false });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      });
      if (!message.value?.toString()) {
        // If the null value is pushed into the kafka queue then simply return. This statement
        // is just to make the typescript happy
        return;
      }

      const parsedValue = JSON.parse(message.value?.toString()); // Since the returned value from the processor and the stored event in the
      // kafka queue is a string , So we are parsing it into a value
      const zapRunId = parsedValue.zapRunId; // You will get the zapRunId from the sended object from the processor to the kafka queue
      const stage = parsedValue.stage;

      console.log(stage);

      const zapRunDetails = await prismaClient.zapRun.findFirst({
        // The above statement is written because the above finded zapRunId is related
        // to which zap
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
      // console.log(zapRunDetails);
      const currentAction = zapRunDetails?.zap.actions.find(
        (x) => x.sortingOrder === stage
      );

      // console.log(currentAction);

      if (!currentAction) {
        console.log("Current action not found?");
        return;
      }

      console.log(currentAction.metadata as JsonObject);

      const zapRunMetadata = zapRunDetails?.metadata;

      console.log(zapRunMetadata);

      if (currentAction.type.id === "email") {
        const body = parse(
          (currentAction.metadata as JsonObject)?.body as string,
          zapRunMetadata
        );
        const to = parse(
          (currentAction.metadata as JsonObject)?.email as string,
          zapRunMetadata
        );
        console.log(`Sending out email to ${to}  is ${body}`);
        await sendEmail(to, body);
      }

      if (currentAction.type.id === "send-sol") {
        const amount = parse(
          (currentAction.metadata as JsonObject)?.amount as string,
          zapRunMetadata
        );
        const address = parse(
          (currentAction.metadata as JsonObject)?.address as string,
          zapRunMetadata
        );
        console.log(`Sending out SOL of ${amount} to address ${address}`);
        await sendSol(address, amount);
      }

      //
      // await new Promise((r) => setTimeout(r, 500));
      const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1; // 1
      console.log(lastStage);
      // const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1; // 1
      // console.log(lastStage);
      // console.log(stage);
      if (lastStage !== stage) {
        // console.log("pushing back to the queue");
        // await producer.send({
        //   // This will push another value to the queue where i have executed one stage which is sending out an email and then
        //   // please do the next step which is going to the next stage which sends solana
        //   topic: TOPIC_NAME,
        //   messages: [
        //     {
        //       value: JSON.stringify({
        //         stage: stage + 1,
        //         zapRunId,
        //       }),
        //     },
        //   ],
        // });
        console.log("pushing back to the queue");
        try {
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
          console.log("Message pushed successfully to Kafka");
        } catch (error) {
          console.error("Error pushing message to Kafka:", error);
        }
      }

      console.log("processing done");
      //
      await consumer.commitOffsets([
        {
          topic: TOPIC_NAME,
          partition: partition,
          offset: (parseInt(message.offset) + 1).toString(), // 5
        },
      ]);
    },
  });
}

main();
