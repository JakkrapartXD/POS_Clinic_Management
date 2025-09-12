# Pharmacy Management System

ระบบจัดการร้านขายยาแบบครบวงจร พร้อมระบบ POS, จัดการสินค้า, และการสำรองข้อมูล

## 🚀 ขั้นตอนการรันโปรเจค

### 1. Clone Repository
```bash
git clone <repository-url>
cd final_project
```

### 2. ตั้งค่า Environment Variables

#### ไฟล์ `.env` (Root Directory)
```env
POSTGRES_DB=your_database_name
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
PGADMIN_DEFAULT_EMAIL=your_pgadmin_email
PGADMIN_DEFAULT_PASSWORD=your_pgadmin_password
```

#### ไฟล์ `.env.development` (Root Directory)
```env
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/database
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
```

#### ไฟล์ `.env.production` (Root Directory)
```env
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/database
REDIS_URL=redis://localhost:6379
FRONTEND_URL=https://your-domain.com
```

#### ไฟล์ `backend/.env`
```env
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=postgresql://user:password@postgres:5432/database
REDIS_URL=redis://redis:6379
FRONTEND_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin1234
```

### 3. รันด้วย Docker Compose

#### Development Mode
```bash
# รันทุก services
docker-compose up -d

# หรือรันเฉพาะ database
docker-compose up -d postgres redis
```

#### Production Mode
```bash
# รันในโหมด production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Database Setup

```bash
# เข้าไปใน backend container
docker-compose exec backend bash

# รัน database migration
bun run prisma:migrate

# รัน seed data (สร้าง admin user และ categories)
bun run prisma:seed
```

### 5. เข้าถึงระบบ

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **PgAdmin**: http://localhost:5050
- **GraphQL Playground**: http://localhost:4000/graphql

### 6. ข้อมูลเข้าสู่ระบบเริ่มต้น

- **Username**: admin (หรือตามที่ตั้งใน ADMIN_USERNAME)
- **Password**: admin1234 (หรือตามที่ตั้งใน ADMIN_PASSWORD)

## 📁 โครงสร้างโปรเจค

```
final_project/
├── frontend/          # Next.js Frontend
├── backend/           # Elysia.js Backend
├── docker-compose.yml # Docker Configuration
├── .env              # Environment Variables
└── README.md         # Documentation
```

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Elysia.js, GraphQL, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Container**: Docker & Docker Compose

## 📋 ฟีเจอร์หลัก

- ✅ ระบบจัดการสินค้า (CRUD)
- ✅ ระบบ POS (Point of Sale)
- ✅ ระบบจัดการผู้ใช้และสิทธิ์
- ✅ ระบบสำรองข้อมูล (Local & Google Drive)
- ✅ ระบบรายงานและสถิติ
- ✅ ระบบจัดการหมวดหมู่สินค้า

---

**หมายเหตุ**: ตรวจสอบให้แน่ใจว่าได้ตั้งค่า environment variables ทั้งหมดก่อนรันระบบ
