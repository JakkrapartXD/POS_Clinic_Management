import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

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

export const authController = (app: Elysia) =>
  app
    .use(cookie())
    .put(
      "/sign-up",
      async ({ body: { username, password, email } }) => {
        return await authService.signUp(username, password, email);
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
        
        // Set cookies
        cookie["next-auth.session-token"].set({
          value: result.sessionToken,
          expires: result.expires,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        });

        cookie["next-auth.jwt-token"].set({
          value: result.token,
          expires: result.expires,
          path: "/",
          httpOnly: true,
          sameSite: "lax",
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
      const sessionToken = cookie["next-auth.session-token"]?.value;
      if (sessionToken) {

        await authService.signOut(sessionToken);
        
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