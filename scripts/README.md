# Audit Logs Scripts

Scripts สำหรับจัดการและวิเคราะห์ Audit Logs ที่บันทึกข้อมูลครบถ้วน (actor, action, resource, time, IP)

## 📋 ข้อมูลที่บันทึกใน Audit Logs

### ✅ ข้อมูลครบถ้วน (Actor, Action, Resource, Time, IP)

- **Actor**: ข้อมูลผู้ใช้งาน (userId, username, role, email)
- **Action**: การกระทำที่เกิดขึ้น (operation)
- **Resource**: ทรัพยากรที่ถูกเข้าถึง (type, id)
- **Time**: เวลาที่เกิดขึ้น (timestamp)
- **IP**: IP address ของผู้ใช้งาน

## 🛠️ Scripts ที่มีอยู่

### 1. Export Scripts

#### `export-daily-audit-logs.sh`
Export audit logs สำหรับ 1 วัน
```bash
./scripts/export-daily-audit-logs.sh [date] [output_file]
# Example: ./scripts/export-daily-audit-logs.sh 2025-01-07
```

#### `export-multi-day-audit-logs.sh`
Export audit logs หลายวันพร้อมกัน
```bash
./scripts/export-multi-day-audit-logs.sh [start_date] [end_date]
# Example: ./scripts/export-multi-day-audit-logs.sh 2025-01-06 2025-01-07
```

#### `export-redis-logs.sh`
Export logs ทั้งหมดจาก Redis (audit, session, rate limiting)
```bash
./scripts/export-redis-logs.sh [output_file]
# Example: ./scripts/export-redis-logs.sh
```

### 2. Analysis Scripts

#### `analyze-audit-logs.sh` ⭐ ใหม่
วิเคราะห์ audit logs แบบละเอียด
```bash
./scripts/analyze-audit-logs.sh [input_file]
# Example: ./scripts/analyze-audit-logs.sh logs/daily-audit-logs-2025-01-07.json
```

**การวิเคราะห์ที่รวมอยู่:**
- Actor Analysis (ผู้ใช้งานที่ active ที่สุด)
- Action Analysis (การกระทำที่เกิดขึ้นบ่อยที่สุด)
- Resource Analysis (ทรัพยากรที่ถูกเข้าถึงบ่อยที่สุด)
- IP Address Analysis (IP addresses ที่ active ที่สุด)
- Time Analysis (การใช้งานตามเวลา)
- Security Analysis (กิจกรรมที่น่าสงสัย)

#### `monitor-audit-logs.sh` ⭐ ใหม่
Monitor audit logs แบบ real-time
```bash
./scripts/monitor-audit-logs.sh [interval_seconds]
# Example: ./scripts/monitor-audit-logs.sh 5
```

### 3. Utility Scripts

#### `manage-logs.sh`
จัดการ logs (ลบ, backup, rotate)
```bash
./scripts/manage-logs.sh
```

#### `monitor-redis.sh`
Monitor Redis performance
```bash
./scripts/monitor-redis.sh
```

#### `redis-info.sh`
แสดงข้อมูล Redis
```bash
./scripts/redis-info.sh
```

## 📊 ตัวอย่างการใช้งาน

### 1. Export และวิเคราะห์ข้อมูลประจำวัน
```bash
# Export ข้อมูลประจำวัน
./scripts/export-daily-audit-logs.sh 2025-01-07

# วิเคราะห์ข้อมูล
./scripts/analyze-audit-logs.sh logs/daily-audit-logs-2025-01-07.json
```

### 2. Monitor แบบ real-time
```bash
# Monitor ทุก 5 วินาที
./scripts/monitor-audit-logs.sh 5
```

### 3. Export ข้อมูลหลายวัน
```bash
# Export ข้อมูล 7 วัน
./scripts/export-multi-day-audit-logs.sh 2025-01-01 2025-01-07
```

## 🔍 การวิเคราะห์ข้อมูล

### ดูข้อมูลสรุป
```bash
cat logs/daily-audit-logs-2025-01-07-summary.txt
```

### วิเคราะห์แบบเฉพาะเจาะจง
```bash
# ดูผู้ใช้งานที่ active ที่สุด
cat logs/daily-audit-logs-2025-01-07.json | jq -r '.[] | .actor.username' | sort | uniq -c | sort -nr | head -5

# ดู actions ที่เกิดขึ้นบ่อยที่สุด
cat logs/daily-audit-logs-2025-01-07.json | jq -r '.[] | .action' | sort | uniq -c | sort -nr | head -5

# ดู IP addresses ที่ active ที่สุด
cat logs/daily-audit-logs-2025-01-07.json | jq -r '.[] | .ipAddress' | sort | uniq -c | sort -nr | head -5

# ดู resource types ที่ถูกเข้าถึงบ่อยที่สุด
cat logs/daily-audit-logs-2025-01-07.json | jq -r '.[] | .resource.type' | sort | uniq -c | sort -nr | head -5
```

## 📁 โครงสร้างไฟล์ที่สร้าง

```
logs/
├── daily-audit-logs-2025-01-07.json          # ข้อมูล JSON
├── daily-audit-logs-2025-01-07-summary.txt   # สรุปข้อมูล
├── daily-audit-logs-2025-01-07-analysis.txt  # การวิเคราะห์ละเอียด
├── multi-day-audit-logs-2025-01-01-to-2025-01-07.json
└── multi-day-audit-logs-2025-01-01-to-2025-01-07-summary.txt
```

## 🔧 การแก้ไขล่าสุด

### ✅ เพิ่มข้อมูลครบถ้วน
- **Actor**: username, role, email
- **IP Address**: client IP address
- **Structured Data**: จัดระเบียบข้อมูลให้เป็นมาตรฐาน

### ✅ Scripts ใหม่
- `analyze-audit-logs.sh`: การวิเคราะห์แบบละเอียด
- `monitor-audit-logs.sh`: Monitor แบบ real-time

### ✅ การปรับปรุง
- แสดงข้อมูล actor และ IP ในทุก scripts
- เพิ่มการวิเคราะห์ security
- เพิ่มการวิเคราะห์ตามเวลา
- เพิ่มการตรวจสอบกิจกรรมที่น่าสงสัย

## 🚨 Security Features

### การตรวจสอบกิจกรรมที่น่าสงสัย
- ผู้ใช้งานที่ใช้ IP addresses หลายตัว
- การเข้าถึงทรัพยากรที่ผิดปกติ
- การกระทำที่เกิดขึ้นบ่อยเกินไป

### การติดตาม
- IP address tracking
- User activity monitoring
- Resource access patterns
- Time-based analysis

## 📞 การใช้งาน

1. **Export ข้อมูล**: ใช้ export scripts เพื่อดึงข้อมูลจาก Redis
2. **วิเคราะห์**: ใช้ analyze script เพื่อวิเคราะห์ข้อมูล
3. **Monitor**: ใช้ monitor script เพื่อติดตามแบบ real-time
4. **ตรวจสอบ**: ดู summary files เพื่อข้อมูลสรุป

## ⚠️ หมายเหตุ

- ต้องมี Redis container ทำงานอยู่
- ต้องมี `jq` ติดตั้งไว้สำหรับการประมวลผล JSON
- ไฟล์ logs จะถูกเก็บไว้ในโฟลเดอร์ `logs/`
- Audit logs จะถูกเก็บไว้ใน Redis เป็นเวลา 24 ชั่วโมง
