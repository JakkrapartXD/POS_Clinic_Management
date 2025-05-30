import { PrismaClient } from "@prisma/client";
import { createClient } from "redis";

const prisma = new PrismaClient();
const redisClient = createClient();

// Initialize Redis connection
(async () => {
  await redisClient.connect();
})();

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

    // Cache in Redis
    await redisClient.set(
      `session:${sessionToken}`,
      JSON.stringify({
        userId,
        expires: expires.toISOString(),
      })
    );

    return { sessionToken, userId, expires };
  }

  async findByToken(sessionToken: string) {
    // Try Redis first
    const sessionData = await redisClient.get(`session:${sessionToken}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (new Date(session.expires) > new Date()) {
        return { ...session, userId: session.userId };
      }
    }

    // Fallback to database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (session && session.expires > new Date()) {
      // Cache for next time
      await redisClient.set(
        `session:${sessionToken}`,
        JSON.stringify({
          userId: session.userId,
          expires: session.expires.toISOString(),
        })
      );

      return session;
    }

    return null;
  }

  async delete(sessionToken: string) {
    // Remove from database
    await prisma.session.delete({
      where: { sessionToken },
    }).catch(() => {
      // Handle session not found
    });

    // Remove from Redis
    await redisClient.del(`session:${sessionToken}`);
  }
}