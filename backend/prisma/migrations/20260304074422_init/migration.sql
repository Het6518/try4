/*
  Warnings:

  - You are about to drop the column `deviceId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `time` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CARD', 'UPI', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "deviceId",
DROP COLUMN "location",
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- CreateTable
CREATE TABLE "CardTransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "cardholderName" TEXT NOT NULL,
    "cardLast4Digits" TEXT NOT NULL,
    "cardNetwork" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "cardExpiryDate" TEXT NOT NULL,
    "billingCountry" TEXT NOT NULL,
    "billingState" TEXT NOT NULL,
    "billingPostal" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "shippingState" TEXT NOT NULL,
    "shippingPostal" TEXT NOT NULL,
    "cvvEntered" BOOLEAN NOT NULL,
    "avsResult" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceOS" TEXT NOT NULL,
    "browserType" TEXT NOT NULL,

    CONSTRAINT "CardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UPITransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "senderUpiId" TEXT NOT NULL,
    "receiverUpiId" TEXT NOT NULL,
    "upiProvider" TEXT NOT NULL,
    "linkedBankName" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceOS" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "authenticationMethod" TEXT NOT NULL,

    CONSTRAINT "UPITransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransfer" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "senderAccountHolderName" TEXT NOT NULL,
    "senderBankName" TEXT NOT NULL,
    "senderAccountNumber" TEXT NOT NULL,
    "receiverAccountHolderName" TEXT NOT NULL,
    "receiverBankName" TEXT NOT NULL,
    "receiverAccountNumber" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "utrNumber" TEXT NOT NULL,
    "remark" TEXT,
    "senderCountry" TEXT NOT NULL,
    "receiverCountry" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceOS" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,

    CONSTRAINT "BankTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardTransaction_transactionId_key" ON "CardTransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "UPITransaction_transactionId_key" ON "UPITransaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransfer_transactionId_key" ON "BankTransfer"("transactionId");

-- AddForeignKey
ALTER TABLE "CardTransaction" ADD CONSTRAINT "CardTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UPITransaction" ADD CONSTRAINT "UPITransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransfer" ADD CONSTRAINT "BankTransfer_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
