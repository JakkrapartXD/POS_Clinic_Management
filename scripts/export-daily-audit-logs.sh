#!/bin/bash

# Script สำหรับ Export Audit Logs ทั้งหมดใน 1 วัน
# Usage: ./scripts/export-daily-audit-logs.sh [date] [output_file]
# Example: ./scripts/export-daily-audit-logs.sh 2025-10-07

TARGET_DATE=${1:-$(date +%Y-%m-%d)}
OUTPUT_FILE=${2:-"logs/daily-audit-logs-${TARGET_DATE}.json"}
CONTAINER_NAME="final_project-redis-1"

echo "🔍 เริ่ม Export Audit Logs สำหรับวันที่: $TARGET_DATE"
echo "📁 Output file: $OUTPUT_FILE"

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

# แปลงวันที่เป็น timestamp
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    START_TIMESTAMP=$(date -j -f "%Y-%m-%d %H:%M:%S" "$TARGET_DATE 00:00:00" +%s)000
    END_TIMESTAMP=$(date -j -f "%Y-%m-%d %H:%M:%S" "$TARGET_DATE 23:59:59" +%s)999
else
    # Linux
    START_TIMESTAMP=$(date -d "$TARGET_DATE 00:00:00" +%s)000
    END_TIMESTAMP=$(date -d "$TARGET_DATE 23:59:59" +%s)999
fi

echo "📅 วันที่: $TARGET_DATE"
echo "⏰ Start Timestamp: $START_TIMESTAMP"
echo "⏰ End Timestamp: $END_TIMESTAMP"

# สร้างไฟล์ JSON เริ่มต้น
echo "[" > "$OUTPUT_FILE"

# Export Audit Logs สำหรับวันที่กำหนด
echo "📊 Export Audit Logs สำหรับวันที่ $TARGET_DATE..."

AUDIT_COUNT=0
TOTAL_KEYS=0

# วนลูปผ่าน audit keys ทั้งหมด
while IFS= read -r key; do
    if [ -n "$key" ]; then
        TOTAL_KEYS=$((TOTAL_KEYS + 1))
        
        # แยก timestamp จาก key
        TIMESTAMP=$(echo "$key" | cut -d: -f3)
        
        # ตรวจสอบว่า timestamp อยู่ในช่วงวันที่ที่กำหนดหรือไม่
        if [ "$TIMESTAMP" -ge "$START_TIMESTAMP" ] && [ "$TIMESTAMP" -le "$END_TIMESTAMP" ]; then
            value=$(docker exec $CONTAINER_NAME redis-cli GET "$key")
            if [ -n "$value" ]; then
                if [ $AUDIT_COUNT -gt 0 ]; then
                    echo "," >> "$OUTPUT_FILE"
                fi
                echo "  {" >> "$OUTPUT_FILE"
                echo "    \"key\": \"$key\"," >> "$OUTPUT_FILE"
                echo "    \"value\": $value," >> "$OUTPUT_FILE"
                echo "    \"timestamp\": $TIMESTAMP," >> "$OUTPUT_FILE"
                echo "    \"date\": \"$TARGET_DATE\"," >> "$OUTPUT_FILE"
                echo "    \"actor\": $(echo "$value" | jq '.actor // {}')," >> "$OUTPUT_FILE"
                echo "    \"action\": $(echo "$value" | jq -r '.action // .operation // "unknown"' | sed 's/^/"/; s/$/"/')," >> "$OUTPUT_FILE"
                echo "    \"resource\": $(echo "$value" | jq '.resource // {type: .entityType, id: .entityId}')," >> "$OUTPUT_FILE"
                echo "    \"ipAddress\": $(echo "$value" | jq -r '.ipAddress // "unknown"' | sed 's/^/"/; s/$/"/')," >> "$OUTPUT_FILE"
                echo "    \"time\": $(echo "$value" | jq -r '.timestamp // "unknown"' | sed 's/^/"/; s/$/"/')" >> "$OUTPUT_FILE"
                echo -n "  }" >> "$OUTPUT_FILE"
                ((AUDIT_COUNT++))
            fi
        fi
    fi
done < <(docker exec $CONTAINER_NAME redis-cli --scan --pattern "audit:*")

# ปิดไฟล์ JSON
echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

# สร้างไฟล์สรุป
SUMMARY_FILE="${OUTPUT_FILE%.json}-summary.txt"
echo "📋 สร้างไฟล์สรุป: $SUMMARY_FILE"

{
    echo "=== Daily Audit Logs Summary ==="
    echo "Export Date: $(date)"
    echo "Target Date: $TARGET_DATE"
    echo "Container: $CONTAINER_NAME"
    echo "Redis IP: $REDIS_IP"
    echo "Redis Port: $REDIS_PORT"
    echo ""
    echo "=== Data Counts ==="
    echo "Total Audit Keys Scanned: $TOTAL_KEYS"
    echo "Audit Logs for $TARGET_DATE: $AUDIT_COUNT"
    echo ""
    echo "=== Time Range ==="
    echo "Start Timestamp: $START_TIMESTAMP"
    echo "End Timestamp: $END_TIMESTAMP"
    echo "Start Time: $TARGET_DATE 00:00:00"
    echo "End Time: $TARGET_DATE 23:59:59"
    echo ""
    echo "=== Files Generated ==="
    echo "JSON Data: $OUTPUT_FILE"
    echo "Summary: $SUMMARY_FILE"
    echo ""
    echo "=== Redis Connection Info ==="
    echo "Connection String: redis://$REDIS_IP:6379"
    echo "Docker Command: docker exec $CONTAINER_NAME redis-cli"
    echo "External Access: redis-cli -h $REDIS_IP -p 6379"
    echo ""
    echo "=== All Daily Audit Operations ==="
    if [ $AUDIT_COUNT -gt 0 ]; then
        echo "All operations for $TARGET_DATE:"
        # แสดง operations ทั้งหมดที่เกิดขึ้นในวันนั้น
        cat "$OUTPUT_FILE" | jq -r '.[] | .action' | sort | uniq -c | sort -nr
        echo ""
        echo "=== Operation Details ==="
        # แสดงรายละเอียด operations ทั้งหมดพร้อม timestamp, actor, และ IP (กรอง unknowns ออก)
        cat "$OUTPUT_FILE" | jq -r '.[] | select(.actor.username != "unknown" and .actor.username != null and .actor.username != "") | "\(.time) | \(.actor.username) (\(.actor.role // "unknown")) | \(.action) | \(.resource.type) | \(.ipAddress)"'
        echo ""
        echo "=== Actor Summary ==="
        # แสดงสรุปผู้ใช้งานที่ทำการ audit (กรอง unknowns ออก)
        cat "$OUTPUT_FILE" | jq -r '.[] | select(.actor.username != "unknown" and .actor.username != null and .actor.username != "") | "\(.actor.username) (\(.actor.role // "unknown"))"' | sort | uniq -c | sort -nr
        echo ""
        echo "=== IP Address Summary ==="
        # แสดงสรุป IP addresses (กรอง unknowns ออก)
        cat "$OUTPUT_FILE" | jq -r '.[] | select(.ipAddress != "unknown" and .ipAddress != null and .ipAddress != "") | .ipAddress' | sort | uniq -c | sort -nr
        echo ""
        echo "=== Resource Type Summary ==="
        # แสดงสรุปประเภทของ resource ที่ถูกเข้าถึง
        cat "$OUTPUT_FILE" | jq -r '.[] | .resource.type' | sort | uniq -c | sort -nr
        echo ""
        echo "=== Filtered Data Summary ==="
        # แสดงสถิติของข้อมูลที่ถูกกรองออก
        UNKNOWN_ACTORS=$(cat "$OUTPUT_FILE" | jq -r '.[] | select(.actor.username == "unknown" or .actor.username == null or .actor.username == "") | .action' | wc -l)
        UNKNOWN_IPS=$(cat "$OUTPUT_FILE" | jq -r '.[] | select(.ipAddress == "unknown" or .ipAddress == null or .ipAddress == "") | .action' | wc -l)
        echo "Records with unknown actors: $UNKNOWN_ACTORS"
        echo "Records with unknown IPs: $UNKNOWN_IPS"
        echo "Total records filtered out: $((UNKNOWN_ACTORS + UNKNOWN_IPS))"
    else
        echo "No audit operations found for $TARGET_DATE"
    fi
} > "$SUMMARY_FILE"

echo ""
echo "✅ Export เสร็จสิ้น!"
echo "📊 สรุปข้อมูล:"
echo "   - วันที่: $TARGET_DATE"
echo "   - Total Keys Scanned: $TOTAL_KEYS"
echo "   - Audit Logs: $AUDIT_COUNT รายการ"
echo ""
echo "📁 ไฟล์ที่สร้าง:"
echo "   - JSON Data: $OUTPUT_FILE"
echo "   - Summary: $SUMMARY_FILE"
echo ""
echo "🔍 ดูข้อมูลสรุป:"
echo "   cat $SUMMARY_FILE"
echo ""
echo "📖 ดูข้อมูล JSON:"
echo "   cat $OUTPUT_FILE | jq ."
echo ""
echo "📊 วิเคราะห์ข้อมูล:"
echo "   cat $OUTPUT_FILE | jq '.[] | .action' | sort | uniq -c"
echo ""
echo "👤 วิเคราะห์ผู้ใช้งาน:"
echo "   cat $OUTPUT_FILE | jq '.[] | .actor.username' | sort | uniq -c"
echo ""
echo "🌐 วิเคราะห์ IP Address:"
echo "   cat $OUTPUT_FILE | jq '.[] | .ipAddress' | sort | uniq -c"
