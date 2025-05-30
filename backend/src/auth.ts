import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { createClient } from "redis";

const prisma = new PrismaClient();
const redisClient = createClient();

await redisClient.connect();

// Secret key for JWT tokens (store in .env)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authModel = t.Object({
  username: t.String(),
  password: t.String({
    minLength: 8,
  }),
});

export const auth = (app: Elysia) =>
  app.group("/auth", (app) =>
    app
      .use(cookie())
      .put(
        "/sign-up",
        async ({ body: { username, password } }) => {
          const hashedPassword = await hash(password, 10);

          const user = await prisma.user.create({
            data: {
              username,
              password: hashedPassword,
            },
          });

          return { success: true, userId: user.id };
        },
        {
          body: authModel,
        }
      )
      .post(
        "/sign-in",
        async ({ set, cookie, body: { username, password } }) => {
          try {
            const user = await prisma.user.findUnique({
              where: { username },
            });

            if (!user) {
              set.status = 401;
              return "Invalid username or password";
            }

            const passwordValid = await compare(password, user.password);
            if (!passwordValid) {
              set.status = 401;
              return "Invalid username or password";
            }

            // Create session
            const sessionToken = generateSessionToken();
            const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

            await prisma.session.create({
              data: {
                sessionToken,
                userId: user.id,
                expires,
              },
            });

            // Store in Redis for faster lookups
            await redisClient.set(
              `session:${sessionToken}`,
              JSON.stringify({
                userId: user.id,
                expires: expires.toISOString(),
              })
            );

            // Create JWT token with NextAuth compatible format
            const token = sign(
              {
                name: user.name || user.username,
                email: user.email,
                picture: user.image,
                sub: user.id,
                sessionToken: sessionToken,
              },
              JWT_SECRET,
              { expiresIn: "30d" }
            );

            // Set session cookie
            cookie["next-auth.session-token"].set({
              value: sessionToken,
              expires,
              path: "/",
              httpOnly: true,
              sameSite: "lax",
            });

            // Set JWT token cookie (useful for API authentication)
            cookie["next-auth.jwt-token"].set({
              value: token,
              expires,
              path: "/",
              httpOnly: true,
              sameSite: "lax",
            });

            return {
              success: true,
              user: { id: user.id, username: user.username },
              token, // Return JWT token for client-side storage if needed
            };
          } catch (error) {
            set.status = 500;
            return "Authentication error";
          }
        },
        {
          body: authModel,
        }
      )
      .get("/session", async ({ cookie, set }) => {
        const sessionToken = cookie["next-auth.session-token"]?.value;
        const jwtToken = cookie["next-auth.jwt-token"]?.value;

        // Try JWT token first (faster)
        if (jwtToken) {
          try {
            const payload = verify(jwtToken, JWT_SECRET);
            const userId = payload.sub;

            // Verify user exists
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                username: true,
                email: true,
                name: true,
                image: true,
              },
            });

            if (user) {
              return {
                authenticated: true,
                user,
                expires:
                  typeof payload === "object" &&
                  payload !== null &&
                  "exp" in payload &&
                  typeof payload.exp === "number"
                    ? new Date(payload.exp * 1000).toISOString()
                    : undefined,
              };
            }
          } catch (error) {
            // JWT invalid or expired, continue with session token
          }
        }

        if (!sessionToken) {
          set.status = 401;
          return { authenticated: false };
        }

        // Try Redis first for performance
        const sessionData = await redisClient.get(`session:${sessionToken}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (new Date(session.expires) > new Date()) {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              select: {
                id: true,
                username: true,
                email: true,
                name: true,
                image: true,
              },
            });

            return {
              authenticated: true,
              user,
              expires: session.expires,
            };
          }
        }

        // Fallback to database
        const session = await prisma.session.findUnique({
          where: { sessionToken },
          include: { user: true },
        });

        if (session && session.expires > new Date()) {
          // Cache in Redis for next time
          await redisClient.set(
            `session:${sessionToken}`,
            JSON.stringify({
              userId: session.userId,
              expires: session.expires.toISOString(),
            })
          );

          return {
            authenticated: true,
            user: {
              id: session.user.id,
              username: session.user.username,
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
            },
            expires: session.expires,
          };
        }

        set.status = 401;
        return { authenticated: false };
      })
      .get("/sign-out", async ({ cookie, set }) => {
        const sessionToken = cookie["next-auth.session-token"]?.value;
        if (sessionToken) {
          await prisma.session
            .delete({
              where: { sessionToken },
            })
            .catch(() => {
              // Handle case where session might not exist in database
            });

          await redisClient.del(`session:${sessionToken}`);

          // Remove both cookies
          cookie["next-auth.session-token"].remove();
          cookie["next-auth.jwt-token"].remove();
        }

        return { success: true };
      })
      .get("/token-verify", async ({ cookie, set }) => {
        const jwtToken = cookie["next-auth.jwt-token"]?.value;

        if (!jwtToken) {
          set.status = 401;
          return { valid: false };
        }

        try {
          const payload = verify(jwtToken, JWT_SECRET);
          return {
            valid: true,
            user: {
              id: payload.sub,
              name: typeof payload === "object" && payload !== null && "name" in payload ? (payload as any).name : undefined,
              email: typeof payload === "object" && payload !== null && "email" in payload ? (payload as any).email : undefined,
            },
          };
        } catch (error) {
          set.status = 401;
          return { valid: false };
        }
      })
      .get("/profile", async ({ cookie, set }) => {
        const sessionToken = cookie["next-auth.session-token"];
        if (!sessionToken) {
          set.status = 401;
          return "Unauthorized";
        }

        const sessionData = await redisClient.get(`session:${sessionToken}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (new Date(session.expires) > new Date()) {
            return prisma.user.findUnique({
              where: { id: session.userId },
              select: {
                id: true,
                username: true,
                email: true,
                name: true,
                image: true,
              },
            });
          }
        }

        set.status = 401;
        return "Unauthorized";
      })
  );

// Helper to generate a random session token
function generateSessionToken() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// Middleware to verify JWT token
export const jwtAuth = () =>
  new Elysia().derive(async ({ cookie, set }) => {
    const jwtToken = cookie["next-auth.jwt-token"]?.value;

    if (!jwtToken) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    try {
      const payload = verify(jwtToken, JWT_SECRET);
      return { user: payload };
    } catch (error) {
      set.status = 401;
      throw new Error("Invalid or expired token");
    }
  });

export default auth;
