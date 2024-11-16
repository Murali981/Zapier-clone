

https://github.com/user-attachments/assets/9e35b9a0-5b66-4757-b631-830b29a30dad

AutomateX: GitHub Bounty Automation System
AutomateX is an innovative GitHub integration platform that automates Solana token disbursement for open-source contributions. The system monitors GitHub repository activities and automatically processes bounty payments when project owners approve contributions through comments.
🌟 Features

Automated Bounty Processing: Automatically sends Solana tokens when repository owners approve contributions
Email Notifications: Sends confirmation emails to contributors upon successful bounty disbursement
Real-time Processing: Achieves millisecond-level response times with event-driven architecture
Fault Tolerance: Implements reliable transaction patterns with automatic retries and error handling
Scalable Architecture: Built with microservices architecture for high availability and maintainability

🏗️ Architecture
The system consists of three main microservices:

Hooks Server:

Handles GitHub webhooks
Processes incoming issue comments
Manages database transactions


Processor Server:

Implements Transactional Outbox pattern
Ensures reliable event processing
Publishes events to Kafka


Worker Server:

Processes Kafka events
Handles Solana transactions
Sends email notifications



🛠️ Technology Stack

Backend: TypeScript, Node.js
Database: PostgreSQL with Prisma ORM
Message Queue: Apache Kafka
Blockchain: Solana (DevNet)
Email Service: SendGrid
Infrastructure: Docker, ngrok (for development)

📋 Prerequisites

Node.js 16+
PostgreSQL 13+
Apache Kafka
Solana CLI tools
SendGrid API key
GitHub webhook secret
ngrok (for local development)

🚀 Getting Started

Clone the repository
git clone https://github.com/murali981/AutomateX.git
cd AutomateX

Install dependencies
npm install

Set up environment variables
# Create .env file
cp .env.example .env

# Add your configuration
POSTGRES_URL=
KAFKA_BROKERS=
SENDGRID_PASSWORD=
EMAIL_FROM=
SOL_PRIVATE_KEY=

Set up the database
# Run Prisma migrations
npx prisma migrate dev

Start the services
# Start all services
npm run hooks-server
npm run processor
npm run worker

Configure GitHub Webhook
Set up ngrok: ngrok http 3003
Add webhook in GitHub repository settings:

Payload URL: https://your-ngrok-url/github-webhook
Content type: application/json
Events: Issue comments

💡 Usage

Setting up a Bounty


Create an issue in your repository
Add a comment with the bounty details in JSON format:
{
  "comment": {
    "amount": 0.00001,
    "address": "SOLANA_ADDRESS",
    "email": "contributor@example.com"
  }
}

Processing


The system automatically processes the comment
Sends Solana tokens to the specified address
Sends confirmation email to the contributor

🔒 Security Considerations

All Solana transactions are handled securely with private key encryption
Email notifications are sent through SendGrid's secure SMTP
GitHub webhook payloads are verified for authenticity
Database transactions are atomic and consistent

📊 Schema
model GithubBountyRun {
  id              String    @id @default(uuid())
  amount          Float
  recipientAddress String
  recipientEmail   String
  githubBountyOutbox GithubBountyOutbox?
  createdAt       DateTime  @default(now())
}

model GithubBountyOutbox {
  id          String    @id @default(uuid())
  bountyRunId String    @unique
  bountyRun   GithubBountyRun @relation(fields: [bountyRunId], references: [id])
  createdAt   DateTime  @default(now())
}



