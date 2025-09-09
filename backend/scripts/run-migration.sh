#!/bin/bash

# Script to run database migration for product relations update
# This script will be executed inside the Docker container

echo "Starting database migration for product relations..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
bunx prisma generate

# Run the migration
echo "Running database migration..."
bunx prisma migrate dev --name "update-product-relations"

# Run the custom SQL script
echo "Running custom SQL updates..."
bunx prisma db execute --file ./scripts/update-product-relations.sql

echo "Migration completed successfully!"
echo "Product relations have been updated with historical data fields."
echo "Foreign key constraints have been set to RESTRICT to prevent accidental deletion."
