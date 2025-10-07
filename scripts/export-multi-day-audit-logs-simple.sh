#!/bin/bash

# Script สำหรับ Export Audit Logs หลายวันพร้อมกัน (แบบง่าย)
# Usage: ./scripts/export-multi-day-audit-logs-simple.sh [start_date] [end_date]
# Example: ./scripts/export-multi-day-audit-logs-simple.sh 2025-10-06 2025-10-07

START_DATE=${1:-$(date +%Y-%m-%d)}
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
COMBINED_FILE="logs/multi-day-audit-logs-${START_DATE}-to-${END_DATE}.json"
echo "📁 Combined file: $COMBINED_FILE"

# สร้างไฟล์ JSON เริ่มต้น
echo "[" > "$COMBINED_FILE"

TOTAL_AUDIT_COUNT=0
TOTAL_DAYS=0

# วนลูปผ่านแต่ละวัน (ใช้วิธีง่ายๆ)
for date in "$START_DATE" "$END_DATE"; do
    echo ""
    echo "📊 Processing date: $date"
    
    # เรียกใช้ daily export script
    DAILY_FILE="logs/daily-audit-logs-${date}.json"
    ./scripts/export-daily-audit-logs.sh "$date" "$DAILY_FILE" > /dev/null 2>&1
    
    # นับจำนวน audit logs ในวันนั้น
    if [ -f "$DAILY_FILE" ]; then
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
    else
        echo "   ❌ Failed to create daily file"
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
    for date in "$START_DATE" "$END_DATE"; do
        DAILY_FILE="logs/daily-audit-logs-${date}.json"
        if [ -f "$DAILY_FILE" ]; then
            DAILY_COUNT=$(cat "$DAILY_FILE" | jq '. | length' 2>/dev/null || echo "0")
            echo "$date: $DAILY_COUNT audit logs"
        else
            echo "$date: 0 audit logs"
        fi
    done
    echo ""
    echo "=== All Operations Statistics ==="
    if [ $TOTAL_AUDIT_COUNT -gt 0 ]; then
        echo "All operations across all days:"
        cat "$COMBINED_FILE" | jq -r '.[] | .value.operation' | sort | uniq -c | sort -nr
        echo ""
        echo "=== Operation Details by Date ==="
        # แสดงรายละเอียด operations แยกตามวันที่
        for date in "$START_DATE" "$END_DATE"; do
            DAILY_FILE="logs/daily-audit-logs-${date}.json"
            if [ -f "$DAILY_FILE" ]; then
                DAILY_COUNT=$(cat "$DAILY_FILE" | jq '. | length' 2>/dev/null || echo "0")
                if [ "$DAILY_COUNT" -gt 0 ]; then
                    echo "--- $date ---"
                    cat "$DAILY_FILE" | jq -r '.[] | "\(.value.timestamp) | \(.value.operation) | \(.value.entityType) | \(.value.details)"'
                fi
            fi
        done
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
