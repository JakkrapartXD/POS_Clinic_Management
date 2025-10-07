import { hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { UserModel } from "../models/UserModel";
import { SessionModel } from "../models/SessionModel";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const userModel = new UserModel();

export class AuthService {
  private sessionModel: SessionModel;

  constructor(redisClient?: any) {
    this.sessionModel = new SessionModel(redisClient);
  }

  async signUp(username: string, password: string, email: string) {
    const hashedPassword = await hash(password, 10);
    const user = await userModel.create({
      username,
      password_hash: hashedPassword,
      email,
      role: 'staff', // เพิ่ม default role เนื่องจาก schema กำหนดให้เป็น required
    });
    
    return { success: true, userId: user.id, user: user };
  }

  async signIn(username: string, password: string) {
    const user = await userModel.findByUsername(username);
    
    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    // ใช้ password_hash แทน password
    const passwordValid = await compare(password, user.password_hash);
    if (!passwordValid) {
      return { success: false, error: "Invalid username or password" };
    }

    // อัพเดต status ของผู้ใช้เป็น active เมื่อ login สำเร็จ
    await userModel.updateStatus(user.id, 'active');

    // สร้าง session
    const sessionToken = this.generateSessionToken();
    const expires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 วัน

    await this.sessionModel.create(sessionToken, user.id, expires);

    // สร้าง JWT token
    const token = sign(
      {
        name: user.username, // ใช้ username แทน name กรณีที่ไม่มี name ใน schema
        email: user.email,
        sub: user.id,
        role: user.role, // เพิ่ม role ใน token
        sessionToken,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      success: true,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
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
    // ดึง userId จาก session
    const userId = await this.sessionModel.getUserIdByToken(sessionToken);
    
    // ลบ session
    await this.sessionModel.delete(sessionToken);
    
    // อัพเดต status ของ user เป็น inactive หากพบ userId
    if (userId) {
      await userModel.updateStatus(userId, 'inactive');
    }
    
    return { success: true };
  }

  async getUserIdBySessionToken(sessionToken: string): Promise<string | null> {
    return await this.sessionModel.getUserIdByToken(sessionToken);
  }

  generateSessionToken() {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
}