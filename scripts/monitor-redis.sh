#!/bin/bash

# Script สำหรับ Monitor Redis แบบ Real-time พร้อม IP
# Usage: ./scripts/monitor-redis.sh [duration_seconds]

DURATION=${1:-60}  # Default 60 seconds
CONTAINER_NAME="final_project-redis-1"

echo "🔍 เริ่ม Monitor Redis แบบ Real-time..."
echo "⏱️ Duration: $DURATION seconds"

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
echo "🔗 Connection String: redis://$REDIS_IP:6379"
echo ""

# สร้างไฟล์ log
LOG_FILE="logs/redis-monitor-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Log file: $LOG_FILE"
echo ""

# เริ่ม monitor
echo "🚀 เริ่ม Monitor Redis Commands..."
echo "⏹️ กด Ctrl+C เพื่อหยุด"
echo ""

# Monitor Redis commands และบันทึกลงไฟล์
{
    echo "=== Redis Monitor Log ==="
    echo "Start Time: $(date)"
    echo "Container: $CONTAINER_NAME"
    echo "Redis IP: $REDIS_IP"
    echo "Redis Port: $REDIS_PORT"
    echo "Duration: $DURATION seconds"
    echo ""
    echo "=== Commands ==="
} > "$LOG_FILE"

# ใช้ timeout เพื่อจำกัดเวลา monitor
timeout $DURATION docker exec $CONTAINER_NAME redis-cli MONITOR >> "$LOG_FILE" 2>&1 &

MONITOR_PID=$!

# แสดงข้อมูล real-time
echo "📊 Real-time Redis Commands:"
echo "================================"

# ใช้ tail เพื่อแสดงข้อมูล real-time
tail -f "$LOG_FILE" &
TAIL_PID=$!

# รอให้ monitor เสร็จสิ้น
wait $MONITOR_PID

# หยุด tail
kill $TAIL_PID 2>/dev/null

echo ""
echo "✅ Monitor เสร็จสิ้น!"
echo "📁 Log file: $LOG_FILE"
echo ""

# สร้างไฟล์สรุป
SUMMARY_FILE="${LOG_FILE%.log}-summary.txt"
echo "📋 สร้างไฟล์สรุป: $SUMMARY_FILE"

{
    echo "=== Redis Monitor Summary ==="
    echo "Monitor Date: $(date)"
    echo "Container: $CONTAINER_NAME"
    echo "Redis IP: $REDIS_IP"
    echo "Redis Port: $REDIS_PORT"
    echo "Duration: $DURATION seconds"
    echo ""
    echo "=== Connection Info ==="
    echo "Connection String: redis://$REDIS_IP:6379"
    echo "Docker Command: docker exec $CONTAINER_NAME redis-cli"
    echo "External Access: redis-cli -h $REDIS_IP -p 6379"
    echo ""
    echo "=== Command Statistics ==="
    if [ -f "$LOG_FILE" ]; then
        echo "Total Commands: $(grep -c "^[0-9]" "$LOG_FILE" 2>/dev/null || echo "0")"
        echo "GET Commands: $(grep -c "GET" "$LOG_FILE" 2>/dev/null || echo "0")"
        echo "SET Commands: $(grep -c "SET" "$LOG_FILE" 2>/dev/null || echo "0")"
        echo "EXPIRE Commands: $(grep -c "EXPIRE" "$LOG_FILE" 2>/dev/null || echo "0")"
        echo "DEL Commands: $(grep -c "DEL" "$LOG_FILE" 2>/dev/null || echo "0")"
    fi
    echo ""
    echo "=== Recent Commands ==="
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE" | grep "^[0-9]" | head -5
    fi
    echo ""
    echo "=== Files Generated ==="
    echo "Monitor Log: $LOG_FILE"
    echo "Summary: $SUMMARY_FILE"
} > "$SUMMARY_FILE"

echo "📊 สรุปข้อมูล:"
echo "   - Log file: $LOG_FILE"
echo "   - Summary: $SUMMARY_FILE"
echo ""
echo "🔍 ดูข้อมูลสรุป:"
echo "   cat $SUMMARY_FILE"
echo ""
echo "📖 ดูข้อมูล log:"
echo "   cat $LOG_FILE"
