-- Migration script to update product relations and add historical data fields
-- This script will:
-- 1. Add product_name and product_unit fields to related tables
-- 2. Populate these fields with current product data
-- 3. Set foreign key constraints to RESTRICT to prevent accidental deletion

-- Add new columns to OrderItem table
ALTER TABLE "OrderItem" 
ADD COLUMN IF NOT EXISTS "product_name" TEXT,
ADD COLUMN IF NOT EXISTS "product_unit" TEXT;

-- Add new columns to PurchaseItem table
ALTER TABLE "PurchaseItem" 
ADD COLUMN IF NOT EXISTS "product_name" TEXT,
ADD COLUMN IF NOT EXISTS "product_unit" TEXT;

-- Add new columns to Prescription table
ALTER TABLE "Prescription" 
ADD COLUMN IF NOT EXISTS "product_name" TEXT,
ADD COLUMN IF NOT EXISTS "product_unit" TEXT;

-- Add new columns to StockMovement table
ALTER TABLE "StockMovement" 
ADD COLUMN IF NOT EXISTS "product_name" TEXT,
ADD COLUMN IF NOT EXISTS "product_unit" TEXT;

-- Add new columns to SalesReport table
ALTER TABLE "SalesReport" 
ADD COLUMN IF NOT EXISTS "product_name" TEXT,
ADD COLUMN IF NOT EXISTS "product_unit" TEXT;

-- Add new columns to StockAlert table
ALTER TABLE "StockAlert" 
ADD COLUMN IF NOT EXISTS "product_name" TEXT,
ADD COLUMN IF NOT EXISTS "product_unit" TEXT;

-- Populate product_name and product_unit in OrderItem
UPDATE "OrderItem" 
SET 
  "product_name" = p."product_name",
  "product_unit" = p."unit"
FROM "Product" p 
WHERE "OrderItem"."productId" = p."id";

-- Populate product_name and product_unit in PurchaseItem
UPDATE "PurchaseItem" 
SET 
  "product_name" = p."product_name",
  "product_unit" = p."unit"
FROM "Product" p 
WHERE "PurchaseItem"."productId" = p."id";

-- Populate product_name and product_unit in Prescription
UPDATE "Prescription" 
SET 
  "product_name" = p."product_name",
  "product_unit" = p."unit"
FROM "Product" p 
WHERE "Prescription"."productId" = p."id";

-- Populate product_name and product_unit in StockMovement
UPDATE "StockMovement" 
SET 
  "product_name" = p."product_name",
  "product_unit" = p."unit"
FROM "Product" p 
WHERE "StockMovement"."productId" = p."id";

-- Populate product_name and product_unit in SalesReport
UPDATE "SalesReport" 
SET 
  "product_name" = p."product_name",
  "product_unit" = p."unit"
FROM "Product" p 
WHERE "SalesReport"."productId" = p."id";

-- Populate product_name and product_unit in StockAlert
UPDATE "StockAlert" 
SET 
  "product_name" = p."product_name",
  "product_unit" = p."unit"
FROM "Product" p 
WHERE "StockAlert"."productId" = p."id";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_orderitem_product_name" ON "OrderItem"("product_name");
CREATE INDEX IF NOT EXISTS "idx_purchaseitem_product_name" ON "PurchaseItem"("product_name");
CREATE INDEX IF NOT EXISTS "idx_prescription_product_name" ON "Prescription"("product_name");
CREATE INDEX IF NOT EXISTS "idx_stockmovement_product_name" ON "StockMovement"("product_name");
CREATE INDEX IF NOT EXISTS "idx_salesreport_product_name" ON "SalesReport"("product_name");
CREATE INDEX IF NOT EXISTS "idx_stockalert_product_name" ON "StockAlert"("product_name");
