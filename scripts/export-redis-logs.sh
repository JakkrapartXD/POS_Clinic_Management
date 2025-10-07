#!/bin/bash

# Script สำหรับ Export Log ย้อนหลังจาก Redis
# Usage: ./scripts/export-redis-logs.sh [output_file]

OUTPUT_FILE=${1:-"logs/redis-logs-$(date +%Y%m%d-%H%M%S).json"}
CONTAINER_NAME="final_project-redis-1"

echo "🔍 เริ่ม Export Log ย้อนหลังจาก Redis..."
echo "📁 Output file: $OUTPUT_FILE"

# ตรวจสอบว่า Redis container ทำงานอยู่หรือไม่
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Redis container ไม่ทำงาน: $CONTAINER_NAME"
    exit 1
fi

echo "✅ พบ Redis container: $CONTAINER_NAME"

# ดู IP address ของ Redis container
REDIS_IP=$(docker inspect $CONTAINER_NAME --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "🌐 Redis IP Address: $REDIS_IP"

# ดู port mapping
REDIS_PORT=$(docker port $CONTAINER_NAME 6379 2>/dev/null || echo "6379")
echo "🔌 Redis Port: $REDIS_PORT"

# สร้างไฟล์ JSON เริ่มต้น
echo "[" > "$OUTPUT_FILE"

# Export Audit Logs
echo "📊 Export Audit Logs..."
AUDIT_COUNT=0
while IFS= read -r key; do
    if [ -n "$key" ]; then
        value=$(docker exec $CONTAINER_NAME redis-cli GET "$key")
        if [ -n "$value" ]; then
            if [ $AUDIT_COUNT -gt 0 ]; then
                echo "," >> "$OUTPUT_FILE"
            fi
            echo "  {" >> "$OUTPUT_FILE"
            echo "    \"key\": \"$key\"," >> "$OUTPUT_FILE"
            echo "    \"value\": $value," >> "$OUTPUT_FILE"
            echo "    \"type\": \"audit\"" >> "$OUTPUT_FILE"
            echo -n "  }" >> "$OUTPUT_FILE"
            ((AUDIT_COUNT++))
        fi
    fi
done < <(docker exec $CONTAINER_NAME redis-cli --scan --pattern "audit:*")

# Export Session Logs
echo ""
echo "🔐 Export Session Logs..."
SESSION_COUNT=0
while IFS= read -r key; do
    if [ -n "$key" ]; then
        value=$(docker exec $CONTAINER_NAME redis-cli GET "$key")
        if [ -n "$value" ]; then
            if [ $AUDIT_COUNT -gt 0 ] || [ $SESSION_COUNT -gt 0 ]; then
                echo "," >> "$OUTPUT_FILE"
            fi
            echo "  {" >> "$OUTPUT_FILE"
            echo "    \"key\": \"$key\"," >> "$OUTPUT_FILE"
            echo "    \"value\": $value," >> "$OUTPUT_FILE"
            echo "    \"type\": \"session\"" >> "$OUTPUT_FILE"
            echo -n "  }" >> "$OUTPUT_FILE"
            ((SESSION_COUNT++))
        fi
    fi
done < <(docker exec $CONTAINER_NAME redis-cli --scan --pattern "session:*")

# Export Rate Limiting Logs
echo ""
echo "⏱️ Export Rate Limiting Logs..."
RATE_COUNT=0
while IFS= read -r key; do
    if [ -n "$key" ]; then
        value=$(docker exec $CONTAINER_NAME redis-cli GET "$key")
        if [ -n "$value" ]; then
            if [ $AUDIT_COUNT -gt 0 ] || [ $SESSION_COUNT -gt 0 ] || [ $RATE_COUNT -gt 0 ]; then
                echo "," >> "$OUTPUT_FILE"
            fi
            echo "  {" >> "$OUTPUT_FILE"
            echo "    \"key\": \"$key\"," >> "$OUTPUT_FILE"
            echo "    \"value\": $value," >> "$OUTPUT_FILE"
            echo "    \"type\": \"rate_limit\"" >> "$OUTPUT_FILE"
            echo -n "  }" >> "$OUTPUT_FILE"
            ((RATE_COUNT++))
        fi
    fi
done < <(docker exec $CONTAINER_NAME redis-cli --scan --pattern "rate_limit:*")

# ปิดไฟล์ JSON
echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

# สร้างไฟล์สรุป
SUMMARY_FILE="${OUTPUT_FILE%.json}-summary.txt"
echo "📋 สร้างไฟล์สรุป: $SUMMARY_FILE"

{
    echo "=== Redis Log Export Summary ==="
    echo "Export Date: $(date)"
    echo "Container: $CONTAINER_NAME"
    echo "Redis IP: $REDIS_IP"
    echo "Redis Port: $REDIS_PORT"
    echo ""
    echo "=== Data Counts ==="
    echo "Audit Logs: $AUDIT_COUNT"
    echo "Session Logs: $SESSION_COUNT"
    echo "Rate Limiting Logs: $RATE_COUNT"
    echo "Total Records: $((AUDIT_COUNT + SESSION_COUNT + RATE_COUNT))"
    echo ""
    echo "=== Files Generated ==="
    echo "JSON Data: $OUTPUT_FILE"
    echo "Summary: $SUMMARY_FILE"
    echo ""
    echo "=== Redis Info ==="
    docker exec $CONTAINER_NAME redis-cli INFO memory | grep -E "(used_memory_human|maxmemory_human)"
    echo ""
    echo "=== Redis Connection Info ==="
    echo "Connection String: redis://$REDIS_IP:6379"
    echo "Docker Command: docker exec $CONTAINER_NAME redis-cli"
    echo "External Access: redis-cli -h $REDIS_IP -p 6379"
    echo ""
    echo "=== All Audit Operations ==="
    echo "All operations across all audit logs:"
    if [ -f "$OUTPUT_FILE" ]; then
        cat "$OUTPUT_FILE" | jq -r '.[] | .value.operation' | sort | uniq -c | sort -nr
    fi
} > "$SUMMARY_FILE"

echo ""
echo "✅ Export เสร็จสิ้น!"
echo "📊 สรุปข้อมูล:"
echo "   - Audit Logs: $AUDIT_COUNT รายการ"
echo "   - Session Logs: $SESSION_COUNT รายการ"
echo "   - Rate Limiting Logs: $RATE_COUNT รายการ"
echo "   - รวม: $((AUDIT_COUNT + SESSION_COUNT + RATE_COUNT)) รายการ"
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
