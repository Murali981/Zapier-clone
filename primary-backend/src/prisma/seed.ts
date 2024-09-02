import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

async function main() {
  await prismaClient.availableTrigger.create({
    data: {
      id: "webhook",
      name: "Webhook",
      image:
        "https://seeklogo.com/images/W/webhooks-logo-04229CC4AE-seeklogo.com.png",
    },
  });

  await prismaClient.availableAction.create({
    data: {
      id: "send-sol",
      name: "Send Solana",
      image:
        "https://assets-global.website-files.com/606f63778ec431ec1b930f1f/6332fb9b18795a52453778ae_solana-logo-vector-01-1024x484.png",
    },
  });

  await prismaClient.availableAction.create({
    data: {
      id: "email",
      name: "Send Email",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwIJdYjwxCnRLdNoKFX27UhBysrk6byS_M-TMcjQWwLBpinkIR-0zJQ61Ke5fkGxfg1EI&usqp=CAU",
    },
  });
}

main();
