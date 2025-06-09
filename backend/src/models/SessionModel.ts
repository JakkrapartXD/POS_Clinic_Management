import { prisma } from "../lib/database";
import { RedisClientType } from "redis";

// Note: Redis client should be passed from the main application
// instead of creating a new connection here

export class SessionModel {
  constructor(private redisClient?: RedisClientType) {}

  async create(sessionToken: string, userId: string, expires: Date) {
    // Create in database
    await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expires,
      },
    });

    // Cache in Redis if available
    if (this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.set(
          `session:${sessionToken}`,
          JSON.stringify({
            userId,
            expires: expires.toISOString(),
          })
        );
      } catch (error) {
        console.error("Failed to cache session in Redis:", error);
      }
    }

    return { sessionToken, userId, expires };
  }

  async findByToken(sessionToken: string) {
    // Try Redis first if available
    if (this.redisClient && this.redisClient.isReady) {
      try {
        const sessionData = await this.redisClient.get(`session:${sessionToken}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (new Date(session.expires) > new Date()) {
            return { ...session, userId: session.userId };
          }
        }
      } catch (error) {
        console.error("Failed to retrieve session from Redis:", error);
      }
    }

    // Fallback to database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (session && session.expires > new Date()) {
      // Cache for next time if Redis available
      if (this.redisClient && this.redisClient.isReady) {
        try {
          await this.redisClient.set(
            `session:${sessionToken}`,
            JSON.stringify({
              userId: session.userId,
              expires: session.expires.toISOString(),
            })
          );
        } catch (error) {
          console.error("Failed to cache session in Redis:", error);
        }
      }

      return session;
    }

    return null;
  }

  async getUserIdByToken(sessionToken: string): Promise<string | null> {
    try {
      // ลองดึงข้อมูลจาก Redis ก่อน
      if (this.redisClient && this.redisClient.isReady) {
        try {
          const sessionData = await this.redisClient.get(`session:${sessionToken}`);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (new Date(session.expires) > new Date()) {
              return session.userId;
            }
          }
        } catch (error) {
          console.error("Failed to retrieve session from Redis:", error);
        }
      }
      
      // ถ้าไม่พบใน Redis ให้ดึงจากฐานข้อมูล
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        select: { userId: true }
      });
      
      return session ? session.userId : null;
    } catch (error) {
      console.error("Error getting userId from session:", error);
      return null;
    }
  }

  async delete(sessionToken: string) {
    // Remove from database
    try {
      await prisma.session.delete({
        where: { sessionToken },
      });
    } catch (error) {
      // Handle session not found
      console.warn("Session not found in database:", sessionToken);
    }

    // Remove from Redis if available
    if (this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.del(`session:${sessionToken}`);
      } catch (error) {
        console.error("Failed to delete session from Redis:", error);
      }
    }
  }
}