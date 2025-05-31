import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface UserCreateInput {
  username: string;
  password: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  role?: string;
}

export class UserModel {
  async create(data: UserCreateInput) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
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

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
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