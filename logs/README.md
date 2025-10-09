# 📁 Logs Directory

Folder นี้เก็บไฟล์ logs ที่ export จาก Redis และระบบต่างๆ

## 📋 ประเภทไฟล์

### 🔍 Redis Logs
- **ไฟล์**: `redis-logs-YYYYMMDD-HHMMSS.json`
- **สรุป**: `redis-logs-YYYYMMDD-HHMMSS-summary.txt`
- **คำอธิบาย**: ข้อมูล logs ทั้งหมดจาก Redis (audit, session, rate limiting)

### 📅 Daily Audit Logs
- **ไฟล์**: `daily-audit-logs-YYYY-MM-DD.json`
- **สรุป**: `daily-audit-logs-YYYY-MM-DD-summary.txt`
- **คำอธิบาย**: Audit logs สำหรับวันที่เฉพาะ

### 📊 Multi-day Audit Logs
- **ไฟล์**: `multi-day-audit-logs-YYYY-MM-DD-to-YYYY-MM-DD.json`
- **สรุป**: `multi-day-audit-logs-YYYY-MM-DD-to-YYYY-MM-DD-summary.txt`
- **คำอธิบาย**: Audit logs สำหรับหลายวัน

### 📈 Monitor Logs
- **ไฟล์**: `redis-monitor-YYYYMMDD-HHMMSS.log`
- **สรุป**: `redis-monitor-YYYYMMDD-HHMMSS-summary.txt`
- **คำอธิบาย**: Real-time monitoring logs จาก Redis

## 🛠️ การใช้งาน

### Export Logs
```bash
# Export Redis logs ทั้งหมด
./scripts/export-redis-logs.sh

# Export audit logs 1 วัน
./scripts/export-daily-audit-logs.sh 2025-10-07

# Export audit logs หลายวัน
./scripts/export-multi-day-audit-logs-simple.sh 2025-10-06 2025-10-07

# Monitor Redis real-time
./scripts/monitor-redis.sh 30
```

### จัดการ Logs
```bash
# ดูรายการไฟล์
./scripts/manage-logs.sh list

# ดูข้อมูล logs
./scripts/manage-logs.sh info

# สร้าง archive
./scripts/manage-logs.sh archive

# ลบไฟล์ logs
./scripts/manage-logs.sh clean
```

### ดูข้อมูล
```bash
# ดูสรุป
cat logs/redis-logs-20251007-145501-summary.txt

# ดู JSON
cat logs/redis-logs-20251007-145501.json | jq .

# วิเคราะห์ operations
cat logs/daily-audit-logs-2025-10-07.json | jq '.[] | .value.operation' | sort | uniq -c
```

## 📊 ข้อมูลในไฟล์

### JSON Structure
```json
{
  "key": "audit:userId:timestamp",
  "value": {
    "operation": "PROCESS_PAYMENT",
    "entityType": "Payment",
    "entityId": "paymentId",
    "details": {
      "orderId": "orderId",
      "amount": 410,
      "type": "cash"
    },
    "timestamp": "2025-10-07T07:45:58.492Z"
  },
  "timestamp": 1759823158492,
  "date": "2025-10-07"
}
```

### Operation Details Format
```
2025-10-07T07:45:58.492Z | PROCESS_PAYMENT | Payment | {"orderId":"cmgg99rj9000bs308kh6psytz","amount":410,"type":"cash"}
```

### Summary Structure
- Redis connection info
- Data counts
- Operation statistics
- Recent operations
- File information

## 🔧 การบำรุงรักษา

### การทำความสะอาด
- ใช้ `./scripts/manage-logs.sh clean` เพื่อลบไฟล์เก่า
- สร้าง archive ก่อนลบ: `./scripts/manage-logs.sh archive`

### การสำรองข้อมูล
- ไฟล์ logs จะถูกเก็บไว้ใน folder นี้
- สามารถสร้าง archive ได้ด้วย `./scripts/manage-logs.sh archive`
- Archive จะถูกสร้างใน root directory

## 📝 หมายเหตุ

- ไฟล์ logs จะถูกสร้างอัตโนมัติเมื่อรัน export scripts
- ไฟล์เก่าจะไม่ถูกลบอัตโนมัติ ต้องลบด้วยตนเอง
- ไฟล์ logs มีข้อมูลสำคัญ ควรสำรองข้อมูลก่อนลบ
