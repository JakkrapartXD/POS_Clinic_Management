import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface UserCreateInput {
  username: string;
  password_hash: string; // เปลี่ยนจาก password เป็น password_hash
  email: string;
  name?: string;
  role?: string;
  status?: string;
}

export interface UserUpdateInput {
  username?: string;
  password_hash?: string; // เปลี่ยนจาก password เป็น password_hash
  email?: string;
  name?: string;
  role?: string;
  status?: string;
}

export class UserModel {
  async create(data: UserCreateInput) {
    return prisma.user.create({
      data: {
        username: data.username,
        password_hash: data.password_hash,
        email: data.email,
        role: data.role || 'user', // กำหนดค่าเริ่มต้น
        status: data.status || 'active',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
      },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password_hash: true, // เปลี่ยนจาก password เป็น password_hash
        email: true,
        role: true,
        status: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }

  async updateRole(id: string, role: string) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        created_at: true,
        status: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      return user?.role === "admin";
    } catch (error) {
      return false;
    }
  }
}