#!/bin/bash

# Script สำหรับ Monitor Audit Logs แบบ Real-time
# Usage: ./scripts/monitor-audit-logs.sh [interval_seconds]
# Example: ./scripts/monitor-audit-logs.sh 5

INTERVAL=${1:-5}
CONTAINER_NAME="final_project-redis-1"

echo "🔍 เริ่ม Monitor Audit Logs แบบ Real-time..."
echo "⏱️ Interval: $INTERVAL วินาที"
echo "📦 Container: $CONTAINER_NAME"
echo ""

# ตรวจสอบว่า Redis container ทำงานอยู่หรือไม่
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Redis container ไม่ทำงาน: $CONTAINER_NAME"
    exit 1
fi

echo "✅ พบ Redis container: $CONTAINER_NAME"
echo ""

# ฟังก์ชันสำหรับแสดง audit log entry
show_audit_entry() {
    local key="$1"
    local value="$2"
    
    # แยกข้อมูลจาก key
    local timestamp=$(echo "$key" | cut -d: -f3)
    local user_id=$(echo "$key" | cut -d: -f2)
    
    # แปลง timestamp เป็น readable format
    local readable_time=$(date -d "@$((timestamp/1000))" 2>/dev/null || echo "unknown")
    
    # แยกข้อมูลจาก value
    local actor_username=$(echo "$value" | jq -r '.actor.username // "unknown"')
    local actor_role=$(echo "$value" | jq -r '.actor.role // "unknown"')
    local action=$(echo "$value" | jq -r '.action // "unknown"')
    local resource_type=$(echo "$value" | jq -r '.resource.type // "unknown"')
    local resource_id=$(echo "$value" | jq -r '.resource.id // "unknown"')
    local ip_address=$(echo "$value" | jq -r '.ipAddress // "unknown"')
    local details=$(echo "$value" | jq -r '.details // "{}"')
    
    echo "🕐 $readable_time"
    echo "👤 Actor: $actor_username ($actor_role)"
    echo "⚡ Action: $action"
    echo "📋 Resource: $resource_type ($resource_id)"
    echo "🌐 IP: $ip_address"
    if [ "$details" != "{}" ] && [ "$details" != "null" ]; then
        echo "📝 Details: $details"
    fi
    echo "---"
}

# เก็บ key เก่าไว้เพื่อเปรียบเทียบ
declare -A previous_keys

# วนลูป monitor
while true; do
    echo "🔍 Checking for new audit logs... ($(date '+%H:%M:%S'))"
    
    # ดึง audit keys ทั้งหมด
    current_keys=()
    while IFS= read -r key; do
        if [ -n "$key" ]; then
            current_keys+=("$key")
        fi
    done < <(docker exec $CONTAINER_NAME redis-cli --scan --pattern "audit:*")
    
    # ตรวจสอบ key ใหม่
    new_count=0
    for key in "${current_keys[@]}"; do
        if [ -z "${previous_keys[$key]}" ]; then
            # Key ใหม่
            value=$(docker exec $CONTAINER_NAME redis-cli GET "$key")
            if [ -n "$value" ]; then
                echo "🆕 New Audit Log Entry:"
                show_audit_entry "$key" "$value"
                new_count=$((new_count + 1))
            fi
        fi
    done
    
    # อัปเดต previous_keys
    unset previous_keys
    declare -A previous_keys
    for key in "${current_keys[@]}"; do
        previous_keys[$key]=1
    done
    
    if [ $new_count -eq 0 ]; then
        echo "✅ No new audit logs found"
    else
        echo "📊 Found $new_count new audit log(s)"
    fi
    
    echo ""
    sleep $INTERVAL
done
