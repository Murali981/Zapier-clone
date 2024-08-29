import { PrismaClient } from "@prisma/client";

import { Kafka } from "kafkajs";

const TOPIC_NAME = "zap-events";

const client = new PrismaClient();

const kafka = new Kafka({
  clientId: "outbox-processor",
  brokers: ["localhost:9092"], // We are running our kafka queue on localhost:9092
});

async function main() {
  const producer = await kafka.producer();
  await producer.connect();
  while (1) {
    const pendingRows = await client.zapRunOutbox.findMany({
      where: {},
      take: 10,
    });

    /* 
     pendingRows is a complex array which looks like below
         [
           {
             id:"1",
            zapRunId:"2"
           },
           {
             id:"2",
            zapRunId:"3"
           }
         ]
    
    
    */

    producer.send({
      topic: TOPIC_NAME,
      messages: pendingRows.map((r) => {
        return {
          value: r.zapRunId,
        };
      }),
    });

    await client.zapRunOutbox.deleteMany({
      where: {
        id: {
          in: pendingRows.map((r) => r.id),
        },
      },
    });
  }
}

main();
