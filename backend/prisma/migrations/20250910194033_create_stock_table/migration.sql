/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock_quantity` on the `Product` table. All the data in the column will be lost.
  - The `expiration_warning_date` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `StockMovement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_productId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DailyReport" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "created_by_username" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "created_by_username" TEXT;

-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_unit" TEXT;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "photo_path" TEXT,
ADD COLUMN     "photo_url" TEXT;

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_unit" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "stock_quantity",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "image_path" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "expiration_warning_date",
ADD COLUMN     "expiration_warning_date" INTEGER,
ALTER COLUMN "morning" SET DATA TYPE TEXT,
ALTER COLUMN "noon" SET DATA TYPE TEXT,
ALTER COLUMN "evening" SET DATA TYPE TEXT,
ALTER COLUMN "before_bed" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_unit" TEXT;

-- AlterTable
ALTER TABLE "SalesReport" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "created_by_username" TEXT,
ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_unit" TEXT;

-- AlterTable
ALTER TABLE "StockAlert" ADD COLUMN     "acknowledged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "created_by_username" TEXT,
ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_unit" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TreatmentPlan" ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_path" TEXT,
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "isDelete" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "StockMovement";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "isDelete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "import_quantity" INTEGER,
    "production_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "sale_price" DOUBLE PRECISION,
    "is_out_of_stock" BOOLEAN NOT NULL DEFAULT false,
    "reference_table" TEXT,
    "reference_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "created_by_username" TEXT,
    "product_name" TEXT,
    "product_unit" TEXT,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_product_type_idx" ON "Product"("product_type");

-- CreateIndex
CREATE INDEX "Product_created_at_idx" ON "Product"("created_at");

-- CreateIndex
CREATE INDEX "Product_product_name_idx" ON "Product"("product_name");

-- CreateIndex
CREATE INDEX "Product_isDelete_idx" ON "Product"("isDelete");

-- CreateIndex
CREATE INDEX "Product_status_categoryId_idx" ON "Product"("status", "categoryId");

-- CreateIndex
CREATE INDEX "Product_status_product_type_idx" ON "Product"("status", "product_type");

-- CreateIndex
CREATE INDEX "Product_status_isDelete_idx" ON "Product"("status", "isDelete");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
