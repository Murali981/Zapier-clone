// import nodemailer from "nodemailer";

// // const transport = nodemailer.createTransport({
// //   host: process.env.SMTP_ENDPOINT,
// //   port: 587,
// //   secure: false,
// //   auth: {
// //     user: process.env.SMTP_USERNAME, // using "dotenv" npm package we can import all the env variables from ".env" file
// //     pass: process.env.SMTP_PASSWORD,
// //   },
// // });

// const transport = nodemailer.createTransport({
//   service: "SendGrid", // Use SendGrid for sending emails
//   auth: {
//     user: process.env.SENDGRID_USERNAME, // For SendGrid, the username should be SENDGRID_USERNAME
//     pass: process.env.SENDGRID_PASSWORD, // This is the SendGrid API key
//   },
//   debug: true, // Enable debug logs
//   logger: true, // Enable logger
// });

// // export async function sendEmail(to: string, body: string) {
// //   // Send out the user an email
// //   await transport.sendMail({
// //     from: process.env.EMAIL_FROM,
// //     sender: process.env.EMAIL_FROM,
// //     to,
// //     subject: "Hello from zapier",
// //     text: body,
// //   });
// // }

// export async function sendEmail(to: string, body: string) {
//   // Verify environment variables
//   if (
//     !process.env.SENDGRID_USERNAME ||
//     !process.env.SENDGRID_PASSWORD ||
//     !process.env.EMAIL_FROM
//   ) {
//     throw new Error("Missing required email configuration");
//   }

//   try {
//     await transport.sendMail({
//       from: process.env.EMAIL_FROM,
//       sender: process.env.EMAIL_FROM,
//       to,
//       subject: "Hello from zapier",
//       text: body,
//     });
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Failed to send email:", error);
//     throw error;
//   }
// }

import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  secure: false,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_PASSWORD,
  },
});

export async function sendEmail(to: string, body: string) {
  try {
    // Add more detailed logging
    console.log("Attempting to send email with config:", {
      from: process.env.EMAIL_FROM,
      to,
      subject: "Hello from zapier",
    });

    const info = await transport.sendMail({
      from: {
        name: "AutomateX",
        address: process.env.EMAIL_FROM as string,
      },
      to,
      subject: "Hello from AutomateX",
      text: body,
    });

    console.log("Email response:", info);
    console.log("Message ID:", info.messageId);
    console.log("SendGrid Response:", info.response);

    return info;
  } catch (error) {
    console.error("Detailed email error:", error);
    throw error;
  }
}
