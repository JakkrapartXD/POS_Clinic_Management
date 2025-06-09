import { PrismaClient } from "@prisma/client";
import { createClient, RedisClientType } from "redis";

const prisma = new PrismaClient();
let redisClient: RedisClientType | null = null;

// สร้าง Redis client ถ้าจำเป็น
try {
  redisClient = createClient();
  
  // Initialize Redis connection
  (async () => {
    await redisClient.connect();
  })();
} catch (error) {
  console.warn("Redis client couldn't be initialized, using database only");
}

export class SessionModel {
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
    if (redisClient) {
      try {
        await redisClient.set(
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
    if (redisClient) {
      try {
        const sessionData = await redisClient.get(`session:${sessionToken}`);
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
      if (redisClient) {
        try {
          await redisClient.set(
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
      if (redisClient) {
        try {
          const sessionData = await redisClient.get(`session:${sessionToken}`);
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
    if (redisClient) {
      try {
        await redisClient.del(`session:${sessionToken}`);
      } catch (error) {
        console.error("Failed to delete session from Redis:", error);
      }
    }
  }
}