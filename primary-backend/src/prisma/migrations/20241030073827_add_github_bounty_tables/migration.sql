-- CreateTable
CREATE TABLE "GithubBountyRun" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubBountyRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubBountyOutbox" (
    "id" TEXT NOT NULL,
    "bountyRunId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubBountyOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubBountyOutbox_bountyRunId_key" ON "GithubBountyOutbox"("bountyRunId");

-- AddForeignKey
ALTER TABLE "GithubBountyOutbox" ADD CONSTRAINT "GithubBountyOutbox_bountyRunId_fkey" FOREIGN KEY ("bountyRunId") REFERENCES "GithubBountyRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
