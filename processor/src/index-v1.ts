// import { PrismaClient } from "@prisma/client";

// import { Kafka } from "kafkajs";

// const TOPIC_NAME = "zap-events-2";

// const client = new PrismaClient();

// const kafka = new Kafka({
//   clientId: "outbox-processor",
//   brokers: ["localhost:9092"], // We are running our kafka queue on localhost:9092
// });

// async function main() {
//   const producer = await kafka.producer(); // initializes a Kafka producer that can send messages to Kafka topics.
//   await producer.connect(); // connects the producer to the Kafka broker, enabling it to start sending messages.
//   while (1) {
//     const pendingRows = await client.zapRunOutbox.findMany({
//       where: {},
//       take: 10,
//     });

//     /*
//      pendingRows is a complex array which looks like below
//          [
//            {
//              id:"1",
//             zapRunId:"2"
//            },
//            {
//              id:"2",
//             zapRunId:"3"
//            }
//          ]

//     */

//     producer.send({
//       topic: TOPIC_NAME,
//       messages: pendingRows.map((r) => {
//         return {
//           value: JSON.stringify({ zapRunId: r.zapRunId, stage: 0 }),
//         };
//       }),
//     });

//     await client.zapRunOutbox.deleteMany({
//       where: {
//         id: {
//           in: pendingRows.map((r) => r.id),
//         },
//       },
//     });
//   }
// }

// main();

//////////////////// VERSION 2 ///////////////////////////////////////////////////////
// import { PrismaClient } from "@prisma/client";
// import { Kafka } from "kafkajs";

// const TOPIC_NAME = "zap-events-3";

// const client = new PrismaClient();

// const kafka = new Kafka({
//   clientId: "outbox-processor",
//   brokers: ["localhost:9092"],
// });

// async function main() {
//   const producer = kafka.producer();
//   await producer.connect();

//   while (1) {
//     const pendingRows = await client.zapRunOutbox.findMany({
//       where: {},
//       take: 10,
//     });
//     console.log(pendingRows);

//     producer.send({
//       topic: TOPIC_NAME,
//       messages: pendingRows.map((r) => {
//         return {
//           value: JSON.stringify({ zapRunId: r.zapRunId, stage: 0 }),
//           /////////////// In the above "stage" means which action are you running , for example action0 means sending solana and
//           // action1 means "sending email" , So along with the zapRunId we are going to send what stage of execution are you on currently
//           // for example stage0 means sending solana and stage1 means sending email and so on if there are any actions more because a user
//           // who have created a zap can add as many actions as he can but in this zapier clone we are supporting only one trigger and two actions
//           // those two actions are sending solana and sending email. It will accept only string that's why we are stringifying it with the
//           // help of JSON.stringify() and this returned string will be pushed into the kafka queue and then the worker process will process it
//           // by pulling all the events from the kafka queue
//         };
//       }),
//     });

//     await client.zapRunOutbox.deleteMany({
//       where: {
//         id: {
//           in: pendingRows.map((x) => x.id),
//         },
//       },
//     });

//     await new Promise((r) => setTimeout(r, 3000));
//   }
// }

// main();

//////////////////////////////////// VERSION 3 ///////////////////////////////////////

import { PrismaClient } from "@prisma/client";
import { Kafka, Producer } from "kafkajs";

const TOPIC_NAME = "zap-events-4";
const client = new PrismaClient();

const kafka = new Kafka({
  clientId: "outbox-processor",
  brokers: ["localhost:9092"],
});

async function processRows(producer: Producer) {
  try {
    const pendingRows = await client.zapRunOutbox.findMany({
      where: {},
      take: 10,
    });

    if (pendingRows.length === 0) {
      return;
    }

    console.log("Found pending rows:", pendingRows);

    // Send messages to Kafka
    const result = await producer.send({
      topic: TOPIC_NAME,
      messages: pendingRows.map((r) => ({
        value: JSON.stringify({ zapRunId: r.zapRunId, stage: 0 }),
      })),
    });

    console.log("Messages sent to Kafka:", result);

    // Only delete after successful send
    await client.zapRunOutbox.deleteMany({
      where: {
        id: {
          in: pendingRows.map((x) => x.id),
        },
      },
    });

    console.log("Deleted processed rows from outbox");
  } catch (error) {
    console.error("Error processing rows:", error);
  }
}

async function main() {
  const producer = kafka.producer();

  try {
    await producer.connect();
    console.log("Producer connected to Kafka");

    // Create topic if it doesn't exist
    const admin = kafka.admin();
    await admin.createTopics({
      topics: [{ topic: TOPIC_NAME, numPartitions: 1 }],
      waitForLeaders: true,
    });

    while (true) {
      await processRows(producer);
      await new Promise((r) => setTimeout(r, 3000));
    }
  } catch (error) {
    console.error("Fatal error:", error);
    await producer.disconnect();
    process.exit(1);
  }
}

main();
