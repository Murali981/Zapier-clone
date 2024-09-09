import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_ENDPOINT,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME, // using "dotenv" npm package we can import all the env variables from ".env" file
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, body: string) {
  // Send out the user an email
  await transport.sendMail({
    from: "teamx@nishaank.online",
    sender: "teamx@nishaank.online",
    to,
    subject: "Hello from zapier",
    text: body,
  });
}
