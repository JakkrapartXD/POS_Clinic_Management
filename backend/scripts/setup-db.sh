#!/bin/bash

echo "🔄 Running Prisma migrations..."
bun prisma migrate deploy

echo "🌱 Seeding the database..."
bun prisma db seed

echo "✅ Database setup complete!"