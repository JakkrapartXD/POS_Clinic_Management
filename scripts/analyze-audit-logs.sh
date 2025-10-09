#!/bin/bash

# Script สำหรับวิเคราะห์ Audit Logs แบบละเอียด
# Usage: ./scripts/analyze-audit-logs.sh [input_file]
# Example: ./scripts/analyze-audit-logs.sh logs/daily-audit-logs-2025-01-07.json

INPUT_FILE=${1:-"logs/daily-audit-logs-$(date +%Y-%m-%d).json"}

echo "🔍 เริ่มวิเคราะห์ Audit Logs..."
echo "📁 Input file: $INPUT_FILE"

# ตรวจสอบว่าไฟล์มีอยู่หรือไม่
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ ไม่พบไฟล์: $INPUT_FILE"
    echo "💡 ใช้คำสั่งนี้เพื่อสร้างไฟล์:"
    echo "   ./scripts/export-daily-audit-logs.sh"
    exit 1
fi

# ตรวจสอบว่าไฟล์มีข้อมูลหรือไม่
TOTAL_RECORDS=$(cat "$INPUT_FILE" | jq '. | length' 2>/dev/null || echo "0")
if [ "$TOTAL_RECORDS" -eq 0 ]; then
    echo "⚠️ ไม่พบข้อมูลในไฟล์: $INPUT_FILE"
    exit 1
fi

echo "✅ พบข้อมูล: $TOTAL_RECORDS รายการ"
echo ""

# สร้างไฟล์รายงาน
REPORT_FILE="${INPUT_FILE%.json}-analysis.txt"
echo "📋 สร้างไฟล์รายงาน: $REPORT_FILE"

{
    echo "=== Audit Logs Analysis Report ==="
    echo "Analysis Date: $(date)"
    echo "Input File: $INPUT_FILE"
    echo "Total Records: $TOTAL_RECORDS"
    echo ""
    
    echo "=== 1. Actor Analysis ==="
    echo "Top 10 Most Active Users:"
    cat "$INPUT_FILE" | jq -r '.[] | "\(.actor.username // "unknown") (\(.actor.role // "unknown"))"' | sort | uniq -c | sort -nr | head -10
    echo ""
    
    echo "User Role Distribution:"
    cat "$INPUT_FILE" | jq -r '.[] | .actor.role // "unknown"' | sort | uniq -c | sort -nr
    echo ""
    
    echo "=== 2. Action Analysis ==="
    echo "Top 10 Most Common Actions:"
    cat "$INPUT_FILE" | jq -r '.[] | .action' | sort | uniq -c | sort -nr | head -10
    echo ""
    
    echo "All Actions Summary:"
    cat "$INPUT_FILE" | jq -r '.[] | .action' | sort | uniq -c | sort -nr
    echo ""
    
    echo "=== 3. Resource Analysis ==="
    echo "Top 10 Most Accessed Resource Types:"
    cat "$INPUT_FILE" | jq -r '.[] | .resource.type' | sort | uniq -c | sort -nr | head -10
    echo ""
    
    echo "All Resource Types Summary:"
    cat "$INPUT_FILE" | jq -r '.[] | .resource.type' | sort | uniq -c | sort -nr
    echo ""
    
    echo "=== 4. IP Address Analysis ==="
    echo "Top 10 Most Active IP Addresses:"
    cat "$INPUT_FILE" | jq -r '.[] | .ipAddress' | sort | uniq -c | sort -nr | head -10
    echo ""
    
    echo "All IP Addresses Summary:"
    cat "$INPUT_FILE" | jq -r '.[] | .ipAddress' | sort | uniq -c | sort -nr
    echo ""
    
    echo "=== 5. Time Analysis ==="
    echo "Activity by Hour (if timestamps available):"
    cat "$INPUT_FILE" | jq -r '.[] | .time' | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c | sort -nr
    echo ""
    
    echo "=== 6. Security Analysis ==="
    echo "Suspicious Activities (multiple IPs for same user):"
    cat "$INPUT_FILE" | jq -r '.[] | "\(.actor.username // "unknown")|\(.ipAddress)"' | sort | uniq | awk -F'|' '{print $1}' | sort | uniq -c | sort -nr | head -10
    echo ""
    
    echo "Users with Multiple IP Addresses:"
    cat "$INPUT_FILE" | jq -r '.[] | "\(.actor.username // "unknown")|\(.ipAddress)"' | sort | uniq | awk -F'|' '{ips[$1] = ips[$1] " " $2} END {for (user in ips) {gsub(/^ /, "", ips[user]); print user ": " ips[user]}}' | sort
    echo ""
    
    echo "=== 7. Detailed Activity Log ==="
    echo "All activities with full details:"
    cat "$INPUT_FILE" | jq -r '.[] | "\(.time) | \(.actor.username // "unknown") (\(.actor.role // "unknown")) | \(.action) | \(.resource.type) | \(.ipAddress) | \(.details // "{}")"'
    echo ""
    
    echo "=== 8. Recommendations ==="
    echo "Based on the analysis above:"
    echo "- Review users with high activity levels"
    echo "- Monitor IP addresses with unusual patterns"
    echo "- Check for any unauthorized access attempts"
    echo "- Verify resource access patterns match expected usage"
    echo "- Consider implementing additional security measures for sensitive operations"
    
} > "$REPORT_FILE"

echo ""
echo "✅ การวิเคราะห์เสร็จสิ้น!"
echo "📊 สรุปข้อมูล:"
echo "   - Total Records: $TOTAL_RECORDS รายการ"
echo "   - Analysis Report: $REPORT_FILE"
echo ""
echo "📁 ไฟล์ที่สร้าง:"
echo "   - Analysis Report: $REPORT_FILE"
echo ""
echo "🔍 ดูรายงาน:"
echo "   cat $REPORT_FILE"
echo ""
echo "📊 วิเคราะห์แบบเฉพาะเจาะจง:"
echo "   # ดูผู้ใช้งานที่ active ที่สุด"
echo "   cat $INPUT_FILE | jq -r '.[] | .actor.username' | sort | uniq -c | sort -nr | head -5"
echo ""
echo "   # ดู actions ที่เกิดขึ้นบ่อยที่สุด"
echo "   cat $INPUT_FILE | jq -r '.[] | .action' | sort | uniq -c | sort -nr | head -5"
echo ""
echo "   # ดู IP addresses ที่ active ที่สุด"
echo "   cat $INPUT_FILE | jq -r '.[] | .ipAddress' | sort | uniq -c | sort -nr | head -5"
echo ""
echo "   # ดู resource types ที่ถูกเข้าถึงบ่อยที่สุด"
echo "   cat $INPUT_FILE | jq -r '.[] | .resource.type' | sort | uniq -c | sort -nr | head -5"
