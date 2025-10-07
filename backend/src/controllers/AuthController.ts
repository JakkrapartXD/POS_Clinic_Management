import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { AuthService } from "../services/AuthService";
import { getCookieNames, getSessionConfig } from "../config/auth";
import { SecurityService } from "../graphql/security";

// Validation schemas
const authSignUpModel = t.Object({
  username: t.String(),
  password: t.String({
    minLength: 8,
  }),
  email: t.String()
});

// Login validation schema (without email)
const authSignInModel = t.Object({
  username: t.String(),
  password: t.String({
    minLength: 8,
  })
});

export const authController = (app: Elysia, redisClient?: any) => {
  const authService = new AuthService(redisClient);
  
  return app
    .use(cookie())
    .put(
      "/sign-up",
      async ({ body: { username, password, email } }) => {
        const result = await authService.signUp(username, password, email);
        
        // Log security tracking for user registration
        if (result.success && result.user) {
          await SecurityService.logSensitiveOperation(
            result.user.id,
            'USER_REGISTRATION',
            'User',
            result.user.id,
            { username, email },
            redisClient
          );
        }
        
        return result;
      },
      {
        body: authSignUpModel,
      }
    )
    .post(
      "/sign-in",
      async ({ set, cookie, body: { username, password } }) => {
        // Get the login credentials and verify password
        const result = await authService.signIn(username, password);
        
        if (!result.success) {
          set.status = 401;
          return { success: false, error: result.error };
        }
        
        // Log security tracking for successful login
        if (result.user) {
          await SecurityService.logSensitiveOperation(
            result.user.id,
            'USER_LOGIN',
            'User',
            result.user.id,
            { username, loginTime: new Date().toISOString() },
            redisClient
          );
        }
        
        // Set cookies
        const cookieNames = getCookieNames();
        const sessionConfig = getSessionConfig();
        
        cookie[cookieNames.sessionToken].set({
          value: result.sessionToken,
          expires: result.expires,
          path: "/",
          httpOnly: sessionConfig.httpOnly,
          sameSite: sessionConfig.sameSite,
        });

        cookie[cookieNames.jwtToken].set({
          value: result.token,
          expires: result.expires,
          path: "/",
          httpOnly: sessionConfig.httpOnly,
          sameSite: sessionConfig.sameSite,
        });

        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      },
      {
        body: authSignInModel,
      }
    )
    .get("/sign-out", async ({ cookie }) => {
      const cookieNames = getCookieNames();
      const sessionToken = cookie[cookieNames.sessionToken]?.value;
      if (sessionToken) {
        // Get user info before signing out for audit log
        const userId = await authService.getUserIdBySessionToken(sessionToken);
        
        await authService.signOut(sessionToken);
        
        // Log security tracking for logout
        if (userId) {
          await SecurityService.logSensitiveOperation(
            userId,
            'USER_LOGOUT',
            'User',
            userId,
            { logoutTime: new Date().toISOString() },
            redisClient
          );
        }
        
        // Remove both cookies
        cookie[cookieNames.sessionToken].remove();
        cookie[cookieNames.jwtToken].remove();
      }

      return { success: true };
    })
    .get("/token-verify", async ({ cookie, set }) => {
      const cookieNames = getCookieNames();
      const jwtToken = cookie[cookieNames.jwtToken]?.value;

      if (!jwtToken) {
        set.status = 401;
        return { valid: false };
      }

      const result = await authService.verifyToken(jwtToken);
      
      if (!result.valid) {
        set.status = 401;
        return { valid: false };
      }
      
      const payload = result.payload;
      
      if (!payload) {
        set.status = 401;
        return { valid: false };
      }
      
      return {
        valid: true,
        user: {
          id: payload.sub,
          name: typeof payload === "object" && payload !== null && "name" in payload ? payload.name : undefined,
          email: typeof payload === "object" && payload !== null && "email" in payload ? payload.email : undefined,
          role: typeof payload === "object" && payload !== null && "role" in payload ? payload.role : undefined,
        },
      };
    });
};