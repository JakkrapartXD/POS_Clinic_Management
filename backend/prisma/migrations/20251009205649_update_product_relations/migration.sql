/*
  Warnings:

  - You are about to drop the column `cost` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `import_quantity` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `is_out_of_stock` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `sale_price` on the `Stock` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Stock` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[national_id]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('open', 'triage', 'doctor', 'pharmacy', 'cashier', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "QueueStation" AS ENUM ('triage', 'doctor', 'pharmacy', 'cashier');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('waiting', 'called', 'in_service', 'done', 'skipped', 'cancelled');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "vat_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vat_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "drug_allergies" TEXT,
ADD COLUMN     "drug_allergies_other" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "medical_conditions" TEXT,
ADD COLUMN     "national_id" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "prefix" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "subdistrict" TEXT,
ADD COLUMN     "zip_code" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "cost",
DROP COLUMN "import_quantity",
DROP COLUMN "is_out_of_stock",
DROP COLUMN "sale_price",
DROP COLUMN "updated_at",
ADD COLUMN     "is_outofstock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quantity_in" INTEGER,
ALTER COLUMN "quantity" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "visit_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VisitStatus" NOT NULL DEFAULT 'open',
    "chief_complaint" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vitals" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "tempC" DOUBLE PRECISION,
    "sbp" INTEGER,
    "dbp" INTEGER,
    "hr" INTEGER,
    "rr" INTEGER,
    "spo2" INTEGER,
    "bmi" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueTicket" (
    "id" TEXT NOT NULL,
    "visitId" TEXT,
    "patientId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "station" "QueueStation" NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'waiting',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "called_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "done_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "station" "QueueStation" NOT NULL,
    "status" "QueueStatus" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "byUserId" TEXT,
    "note" TEXT,

    CONSTRAINT "QueueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitOrder" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_patientId_visit_date_idx" ON "Visit"("patientId", "visit_date");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_visit_date_idx" ON "Visit"("visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "Vitals_visitId_key" ON "Vitals"("visitId");

-- CreateIndex
CREATE INDEX "QueueTicket_station_status_created_at_idx" ON "QueueTicket"("station", "status", "created_at");

-- CreateIndex
CREATE INDEX "QueueTicket_patientId_idx" ON "QueueTicket"("patientId");

-- CreateIndex
CREATE INDEX "QueueTicket_visitId_idx" ON "QueueTicket"("visitId");

-- CreateIndex
CREATE INDEX "QueueTicket_number_station_idx" ON "QueueTicket"("number", "station");

-- CreateIndex
CREATE INDEX "QueueEvent_ticketId_at_idx" ON "QueueEvent"("ticketId", "at");

-- CreateIndex
CREATE INDEX "VisitOrder_orderId_idx" ON "VisitOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitOrder_visitId_orderId_key" ON "VisitOrder"("visitId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_national_id_key" ON "Patient"("national_id");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vitals" ADD CONSTRAINT "Vitals_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueTicket" ADD CONSTRAINT "QueueTicket_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueEvent" ADD CONSTRAINT "QueueEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "QueueTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitOrder" ADD CONSTRAINT "VisitOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitOrder" ADD CONSTRAINT "VisitOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
