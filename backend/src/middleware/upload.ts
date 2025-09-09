import { mkdir, writeFile, stat, unlink } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

export interface UploadConfig {
  maxFileSize: number; // bytes
  allowedTypes: string[];
  uploadPath: string;
}

export const defaultUploadConfig: UploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'],
  uploadPath: './public/uploads'
};

export class UploadService {
  private config: UploadConfig;

  constructor(config: UploadConfig = defaultUploadConfig) {
    this.config = config;
  }

  async ensureUploadDir(category: string): Promise<string> {
    const uploadDir = join(this.config.uploadPath, category);
    try {
      await stat(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  async saveFile(file: File, category: string): Promise<{ filename: string; path: string; url: string }> {
    // Validate file size
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size exceeds ${this.config.maxFileSize / 1024 / 1024}MB limit`);
    }

    // Validate file type
    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`);
    }

    // Generate unique filename with correct extension based on MIME type
    let extension = extname(file.name);
    
    // Map MIME types to correct extensions
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    
    // Use MIME type to determine correct extension
    if (mimeToExt[file.type]) {
      extension = mimeToExt[file.type];
    }
    
    const filename = `${randomUUID()}${extension}`;
    
    // Ensure upload directory exists
    const uploadDir = await this.ensureUploadDir(category);
    const filePath = join(uploadDir, filename);
    
    // Save file
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));
    
    // Return file info
    return {
      filename,
      path: filePath,
      url: `/uploads/${category}/${filename}`
    };
  }

  async deleteFile(category: string, filename: string): Promise<void> {
    const filePath = join(this.config.uploadPath, category, filename);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }

  validateCategory(category: string): boolean {
    const allowedCategories = ['users', 'patients', 'products'];
    return allowedCategories.includes(category);
  }

  extractFilenameFromUrl(url: string): string | null {
    const match = url.match(/\/uploads\/[^\/]+\/([^\/]+)$/);
    return match ? match[1] : null;
  }
}

export const uploadService = new UploadService();
