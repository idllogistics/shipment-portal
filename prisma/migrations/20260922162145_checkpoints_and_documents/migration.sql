-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('GOOD', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ApproverRole" AS ENUM ('SENDER', 'RECEIVER');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "checkpointId" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "declaredValue" DOUBLE PRECISION,
ADD COLUMN     "declaredValueCurrency" TEXT DEFAULT 'AED',
ADD COLUMN     "itemDescription" TEXT,
ADD COLUMN     "itemQuantity" TEXT;

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" "CheckpointType" NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "conditionNotes" TEXT,
    "approverName" TEXT NOT NULL,
    "approverRole" "ApproverRole" NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentDocument" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "itemDescription" TEXT,
    "itemQuantity" TEXT,
    "declaredValue" DOUBLE PRECISION,
    "declaredValueCurrency" TEXT,
    "extractionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentDocument" ADD CONSTRAINT "ShipmentDocument_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
