#!/bin/bash

# Script สำหรับดูข้อมูล Redis พร้อม IP
# Usage: ./scripts/redis-info.sh

CONTAINER_NAME="final_project-redis-1"

echo "🔍 ข้อมูล Redis Container"
echo "=========================="

# ตรวจสอบว่า Redis container ทำงานอยู่หรือไม่
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Redis container ไม่ทำงาน: $CONTAINER_NAME"
    exit 1
fi

# ดู IP address ของ Redis container
REDIS_IP=$(docker inspect $CONTAINER_NAME --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
REDIS_PORT=$(docker port $CONTAINER_NAME 6379 2>/dev/null || echo "6379")

echo "✅ Container: $CONTAINER_NAME"
echo "🌐 IP Address: $REDIS_IP"
echo "🔌 Port: $REDIS_PORT"
echo "🔗 Connection String: redis://$REDIS_IP:6379"
echo ""

echo "📊 Redis Information"
echo "===================="

# ดูข้อมูล Redis info
echo "💾 Memory Usage:"
docker exec $CONTAINER_NAME redis-cli INFO memory | grep -E "(used_memory_human|maxmemory_human|used_memory_peak_human)"

echo ""
echo "📈 Statistics:"
docker exec $CONTAINER_NAME redis-cli INFO stats | grep -E "(total_connections_received|total_commands_processed|instantaneous_ops_per_sec)"

echo ""
echo "🗂️ Database Info:"
docker exec $CONTAINER_NAME redis-cli INFO keyspace

echo ""
echo "🔑 Key Counts:"
echo "Audit Logs: $(docker exec $CONTAINER_NAME redis-cli --scan --pattern "audit:*" | wc -l)"
echo "Session Logs: $(docker exec $CONTAINER_NAME redis-cli --scan --pattern "session:*" | wc -l)"
echo "Rate Limiting Logs: $(docker exec $CONTAINER_NAME redis-cli --scan --pattern "rate_limit:*" | wc -l)"
echo "Total Keys: $(docker exec $CONTAINER_NAME redis-cli DBSIZE)"

echo ""
echo "🔧 Connection Commands:"
echo "Docker: docker exec $CONTAINER_NAME redis-cli"
echo "External: redis-cli -h $REDIS_IP -p 6379"
echo "Monitor: docker exec $CONTAINER_NAME redis-cli MONITOR"

echo ""
echo "📝 Recent Audit Operations:"
docker exec $CONTAINER_NAME redis-cli --scan --pattern "audit:*" | head -3 | while read key; do
    if [ -n "$key" ]; then
        value=$(docker exec $CONTAINER_NAME redis-cli GET "$key")
        echo "Key: $key"
        echo "Value: $value"
        echo "---"
    fi
done

