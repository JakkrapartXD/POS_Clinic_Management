#!/bin/bash

# Script สำหรับจัดการ Logs
# Usage: ./scripts/manage-logs.sh [command]
# Commands: list, clean, archive, info

COMMAND=${1:-"list"}
LOGS_DIR="logs"

echo "📁 Logs Management Script"
echo "========================="

case $COMMAND in
    "list"|"ls")
        echo "📋 รายการไฟล์ Logs:"
        echo ""
        if [ -d "$LOGS_DIR" ]; then
            echo "📊 สรุปไฟล์:"
            echo "Total files: $(ls -1 $LOGS_DIR/ | wc -l)"
            echo "Total size: $(du -sh $LOGS_DIR/ | cut -f1)"
            echo ""
            echo "📁 รายละเอียดไฟล์:"
            ls -lah $LOGS_DIR/ | grep -v "^total"
            echo ""
            echo "📈 ประเภทไฟล์:"
            echo "JSON files: $(ls -1 $LOGS_DIR/*.json 2>/dev/null | wc -l)"
            echo "Summary files: $(ls -1 $LOGS_DIR/*.txt 2>/dev/null | wc -l)"
            echo "Log files: $(ls -1 $LOGS_DIR/*.log 2>/dev/null | wc -l)"
        else
            echo "❌ ไม่พบ folder logs"
        fi
        ;;
    
    "clean"|"clear")
        echo "🧹 ทำความสะอาด Logs:"
        echo ""
        if [ -d "$LOGS_DIR" ]; then
            echo "ไฟล์ที่จะลบ:"
            ls -lah $LOGS_DIR/
            echo ""
            read -p "ต้องการลบไฟล์ทั้งหมดใน folder logs หรือไม่? (y/N): " confirm
            if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
                rm -rf $LOGS_DIR/*
                echo "✅ ลบไฟล์ logs เรียบร้อย"
            else
                echo "❌ ยกเลิกการลบ"
            fi
        else
            echo "❌ ไม่พบ folder logs"
        fi
        ;;
    
    "archive")
        echo "📦 Archive Logs:"
        echo ""
        if [ -d "$LOGS_DIR" ] && [ "$(ls -A $LOGS_DIR)" ]; then
            ARCHIVE_NAME="logs-archive-$(date +%Y%m%d-%H%M%S).tar.gz"
            echo "สร้าง archive: $ARCHIVE_NAME"
            tar -czf "$ARCHIVE_NAME" -C . logs/
            echo "✅ สร้าง archive เรียบร้อย: $ARCHIVE_NAME"
            echo "📊 ขนาดไฟล์: $(du -sh $ARCHIVE_NAME | cut -f1)"
        else
            echo "❌ ไม่พบไฟล์ logs หรือ folder logs ว่าง"
        fi
        ;;
    
    "info")
        echo "ℹ️ ข้อมูล Logs:"
        echo ""
        if [ -d "$LOGS_DIR" ]; then
            echo "📁 Folder: $LOGS_DIR"
            echo "📊 จำนวนไฟล์: $(ls -1 $LOGS_DIR/ | wc -l)"
            echo "💾 ขนาดรวม: $(du -sh $LOGS_DIR/ | cut -f1)"
            echo ""
            echo "📋 ประเภทไฟล์:"
            echo "  - Redis Logs: $(ls -1 $LOGS_DIR/redis-logs-*.json 2>/dev/null | wc -l) files"
            echo "  - Daily Audit Logs: $(ls -1 $LOGS_DIR/daily-audit-logs-*.json 2>/dev/null | wc -l) files"
            echo "  - Multi-day Audit Logs: $(ls -1 $LOGS_DIR/multi-day-audit-logs-*.json 2>/dev/null | wc -l) files"
            echo "  - Monitor Logs: $(ls -1 $LOGS_DIR/redis-monitor-*.log 2>/dev/null | wc -l) files"
            echo "  - Summary Files: $(ls -1 $LOGS_DIR/*.txt 2>/dev/null | wc -l) files"
            echo ""
            echo "📅 ไฟล์ล่าสุด:"
            ls -lt $LOGS_DIR/ | head -5
        else
            echo "❌ ไม่พบ folder logs"
        fi
        ;;
    
    "help"|"-h"|"--help")
        echo "📖 วิธีใช้งาน:"
        echo ""
        echo "Commands:"
        echo "  list, ls     - แสดงรายการไฟล์ logs"
        echo "  clean, clear - ลบไฟล์ logs ทั้งหมด"
        echo "  archive      - สร้าง archive ของ logs"
        echo "  info         - แสดงข้อมูล logs"
        echo "  help         - แสดงวิธีใช้งาน"
        echo ""
        echo "Examples:"
        echo "  ./scripts/manage-logs.sh list"
        echo "  ./scripts/manage-logs.sh clean"
        echo "  ./scripts/manage-logs.sh archive"
        echo "  ./scripts/manage-logs.sh info"
        ;;
    
    *)
        echo "❌ คำสั่งไม่ถูกต้อง: $COMMAND"
        echo "ใช้ './scripts/manage-logs.sh help' เพื่อดูวิธีใช้งาน"
        ;;
esac

