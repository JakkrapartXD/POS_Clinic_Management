import { hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { UserModel } from "../models/UserModel";
import { SessionModel } from "../models/SessionModel";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const userModel = new UserModel();
const sessionModel = new SessionModel();

export class AuthService {
  async signUp(username: string, password: string) {
    const hashedPassword = await hash(password, 10);
    const user = await userModel.create({
      username,
      password: hashedPassword,
    });
    
    return { success: true, userId: user.id };
  }

  async signIn(username: string, password: string) {
    const user = await userModel.findByUsername(username);
    
    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    const passwordValid = await compare(password, user.password);
    if (!passwordValid) {
      return { success: false, error: "Invalid username or password" };
    }

    // Create session
    const sessionToken = this.generateSessionToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await sessionModel.create(sessionToken, user.id, expires);

    // Create JWT token
    const token = sign(
      {
        name: user.name || user.username,
        email: user.email,
        picture: user.image,
        sub: user.id,
        sessionToken,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return {
      success: true,
      user: { id: user.id, username: user.username },
      sessionToken,
      token,
      expires,
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = verify(token, JWT_SECRET);
      return {
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        error: "Invalid token",
      };
    }
  }

  async signOut(sessionToken: string) {
    await sessionModel.delete(sessionToken);
    return { success: true };
  }

  generateSessionToken() {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
}