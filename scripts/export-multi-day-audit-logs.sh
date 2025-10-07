#!/bin/bash

# Script สำหรับ Export Audit Logs หลายวันพร้อมกัน
# Usage: ./scripts/export-multi-day-audit-logs.sh [start_date] [end_date]
# Example: ./scripts/export-multi-day-audit-logs.sh 2025-10-06 2025-10-07

START_DATE=${1:-$(date -d "yesterday" +%Y-%m-%d)}
END_DATE=${2:-$(date +%Y-%m-%d)}
CONTAINER_NAME="final_project-redis-1"

echo "🔍 เริ่ม Export Audit Logs หลายวัน"
echo "📅 วันที่เริ่มต้น: $START_DATE"
echo "📅 วันที่สิ้นสุด: $END_DATE"

# ตรวจสอบว่า Redis container ทำงานอยู่หรือไม่
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Redis container ไม่ทำงาน: $CONTAINER_NAME"
    exit 1
fi

# ดู IP address ของ Redis container
REDIS_IP=$(docker inspect $CONTAINER_NAME --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
REDIS_PORT=$(docker port $CONTAINER_NAME 6379 2>/dev/null || echo "6379")

echo "✅ พบ Redis container: $CONTAINER_NAME"
echo "🌐 Redis IP Address: $REDIS_IP"
echo "🔌 Redis Port: $REDIS_PORT"

# สร้างไฟล์รวม
COMBINED_FILE="multi-day-audit-logs-${START_DATE}-to-${END_DATE}.json"
echo "📁 Combined file: $COMBINED_FILE"

# สร้างไฟล์ JSON เริ่มต้น
echo "[" > "$COMBINED_FILE"

TOTAL_AUDIT_COUNT=0
TOTAL_DAYS=0

# วนลูปผ่านแต่ละวัน
CURRENT_DATE=$START_DATE
while [ "$CURRENT_DATE" != "$END_DATE" ] && [ "$CURRENT_DATE" != "$(date -d "$END_DATE + 1 day" +%Y-%m-%d 2>/dev/null || date -j -v+1d -f "%Y-%m-%d" "$END_DATE" +%Y-%m-%d 2>/dev/null)" ]; do
    echo ""
    echo "📊 Processing date: $CURRENT_DATE"
    
    # เรียกใช้ daily export script
    DAILY_FILE="daily-audit-logs-${CURRENT_DATE}.json"
    ./scripts/export-daily-audit-logs.sh "$CURRENT_DATE" "$DAILY_FILE" > /dev/null 2>&1
    
    # นับจำนวน audit logs ในวันนั้น
    DAILY_COUNT=$(cat "$DAILY_FILE" | jq '. | length' 2>/dev/null || echo "0")
    
    if [ "$DAILY_COUNT" -gt 0 ]; then
        echo "   ✅ Found $DAILY_COUNT audit logs"
        
        # เพิ่มข้อมูลลงไฟล์รวม
        if [ $TOTAL_AUDIT_COUNT -gt 0 ]; then
            echo "," >> "$COMBINED_FILE"
        fi
        
        # เอา [ และ ] ออกแล้วเพิ่มข้อมูล
        cat "$DAILY_FILE" | jq -c '.[]' | while read -r line; do
            if [ $TOTAL_AUDIT_COUNT -gt 0 ]; then
                echo "," >> "$COMBINED_FILE"
            fi
            echo "  $line" >> "$COMBINED_FILE"
            TOTAL_AUDIT_COUNT=$((TOTAL_AUDIT_COUNT + 1))
        done
        
        TOTAL_DAYS=$((TOTAL_DAYS + 1))
    else
        echo "   ⚠️ No audit logs found"
    fi
    
    # ไปยังวันถัดไป
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        CURRENT_DATE=$(date -j -v+1d -f "%Y-%m-%d" "$CURRENT_DATE" +%Y-%m-%d)
    else
        # Linux
        CURRENT_DATE=$(date -d "$CURRENT_DATE + 1 day" +%Y-%m-%d)
    fi
done

# ปิดไฟล์ JSON
echo "" >> "$COMBINED_FILE"
echo "]" >> "$COMBINED_FILE"

# สร้างไฟล์สรุป
SUMMARY_FILE="${COMBINED_FILE%.json}-summary.txt"
echo "📋 สร้างไฟล์สรุป: $SUMMARY_FILE"

{
    echo "=== Multi-Day Audit Logs Summary ==="
    echo "Export Date: $(date)"
    echo "Start Date: $START_DATE"
    echo "End Date: $END_DATE"
    echo "Container: $CONTAINER_NAME"
    echo "Redis IP: $REDIS_IP"
    echo "Redis Port: $REDIS_PORT"
    echo ""
    echo "=== Data Counts ==="
    echo "Total Days Processed: $TOTAL_DAYS"
    echo "Total Audit Logs: $TOTAL_AUDIT_COUNT"
    echo ""
    echo "=== Files Generated ==="
    echo "Combined JSON: $COMBINED_FILE"
    echo "Summary: $SUMMARY_FILE"
    echo ""
    echo "=== Daily Breakdown ==="
    CURRENT_DATE=$START_DATE
    while [[ "$CURRENT_DATE" <= "$END_DATE" ]]; do
        DAILY_FILE="daily-audit-logs-${CURRENT_DATE}.json"
        if [ -f "$DAILY_FILE" ]; then
            DAILY_COUNT=$(cat "$DAILY_FILE" | jq '. | length' 2>/dev/null || echo "0")
            echo "$CURRENT_DATE: $DAILY_COUNT audit logs"
        else
            echo "$CURRENT_DATE: 0 audit logs"
        fi
        
        # ไปยังวันถัดไป
        if [[ "$OSTYPE" == "darwin"* ]]; then
            CURRENT_DATE=$(date -j -v+1d -f "%Y-%m-%d" "$CURRENT_DATE" +%Y-%m-%d)
        else
            CURRENT_DATE=$(date -d "$CURRENT_DATE + 1 day" +%Y-%m-%d)
        fi
    done
    echo ""
    echo "=== Operation Statistics ==="
    if [ $TOTAL_AUDIT_COUNT -gt 0 ]; then
        echo "All operations across all days:"
        cat "$COMBINED_FILE" | jq -r '.[] | .value.operation' | sort | uniq -c | sort -nr
    fi
    echo ""
    echo "=== Redis Connection Info ==="
    echo "Connection String: redis://$REDIS_IP:6379"
    echo "Docker Command: docker exec $CONTAINER_NAME redis-cli"
    echo "External Access: redis-cli -h $REDIS_IP -p 6379"
} > "$SUMMARY_FILE"

echo ""
echo "✅ Multi-day Export เสร็จสิ้น!"
echo "📊 สรุปข้อมูล:"
echo "   - วันที่: $START_DATE ถึง $END_DATE"
echo "   - จำนวนวัน: $TOTAL_DAYS วัน"
echo "   - Total Audit Logs: $TOTAL_AUDIT_COUNT รายการ"
echo ""
echo "📁 ไฟล์ที่สร้าง:"
echo "   - Combined JSON: $COMBINED_FILE"
echo "   - Summary: $SUMMARY_FILE"
echo ""
echo "🔍 ดูข้อมูลสรุป:"
echo "   cat $SUMMARY_FILE"
echo ""
echo "📖 ดูข้อมูล JSON:"
echo "   cat $COMBINED_FILE | jq ."
echo ""
echo "📊 วิเคราะห์ข้อมูล:"
echo "   cat $COMBINED_FILE | jq '.[] | .value.operation' | sort | uniq -c"
