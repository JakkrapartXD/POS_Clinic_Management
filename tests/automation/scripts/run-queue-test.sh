#!/bin/bash

# Script สำหรับรัน E2E test ระบบคิว
# Usage: ./scripts/run-queue-test.sh [browser]

set -e

# กำหนดค่าเริ่มต้น
BROWSER=${1:-chromium}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AUTOMATION_DIR="$PROJECT_DIR/tests/automation"

echo "🚀 เริ่มรัน E2E Test ระบบคิว"
echo "📁 Project Directory: $PROJECT_DIR"
echo "🌐 Browser: $BROWSER"
echo ""

# ตรวจสอบว่าอยู่ใน directory ที่ถูกต้อง
if [ ! -f "$AUTOMATION_DIR/package.json" ]; then
    echo "❌ ไม่พบ package.json ใน automation directory"
    echo "กรุณารัน script นี้จาก project root directory"
    exit 1
fi

# เปลี่ยนไปยัง automation directory
cd "$AUTOMATION_DIR"

echo "📋 ตรวจสอบ dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 ติดตั้ง dependencies..."
    pnpm install
fi

echo "🔧 ตรวจสอบ test users..."
cd "$PROJECT_DIR/backend"
if ! npm run test-users list | grep -q "staff01"; then
    echo "👥 สร้าง test users..."
    npm run test-users create
fi

echo "🌐 เริ่มรัน E2E test ระบบคิว..."
cd "$AUTOMATION_DIR"

# รัน test เฉพาะ queue-system.spec.ts
pnpm exec playwright test src/e2e/queue-system.spec.ts --project=$BROWSER --headed

echo ""
echo "✅ E2E Test ระบบคิวเสร็จสิ้น!"
echo "📊 ดูผลลัพธ์ได้ที่: $AUTOMATION_DIR/playwright-report/index.html"
