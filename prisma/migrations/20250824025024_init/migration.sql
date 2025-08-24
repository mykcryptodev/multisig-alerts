-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Multisig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Multisig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "telegramBotToken" TEXT,
    "telegramChatId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeenTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "multisigId" TEXT NOT NULL,
    "safeTxHash" TEXT NOT NULL,
    "firstSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChecked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "threshold" INTEGER NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SeenTransaction_multisigId_fkey" FOREIGN KEY ("multisigId") REFERENCES "Multisig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Multisig_userId_idx" ON "Multisig"("userId");

-- CreateIndex
CREATE INDEX "Multisig_enabled_idx" ON "Multisig"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Multisig_userId_chainId_address_key" ON "Multisig"("userId", "chainId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_userId_key" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "NotificationSetting_userId_idx" ON "NotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "SeenTransaction_multisigId_idx" ON "SeenTransaction"("multisigId");

-- CreateIndex
CREATE INDEX "SeenTransaction_safeTxHash_idx" ON "SeenTransaction"("safeTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "SeenTransaction_multisigId_safeTxHash_key" ON "SeenTransaction"("multisigId", "safeTxHash");

