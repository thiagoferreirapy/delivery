import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

// ===== StorageService =====
// Interface isolada. Default: disco local (/uploads servido estático).
// Adapter R2 stubbado (S3-compatible) — plugar com credenciais do .env.

export interface StoredFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StorageService {
  upload(file: StoredFile): Promise<string>; // retorna URL pública
}

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

function safeName(original: string): string {
  const ext = path.extname(original).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${base}${ext || ".bin"}`;
}

class LocalStorage implements StorageService {
  async upload(file: StoredFile): Promise<string> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = safeName(file.originalName);
    await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
    return `${env.storage.publicBaseUrl}/uploads/${name}`;
  }
}

// Adapter real (stub funcional): sem SDK ainda, cai no local com aviso.
// Plugar aqui @aws-sdk/client-s3 apontando pro endpoint R2.
class R2Storage implements StorageService {
  private fallback = new LocalStorage();
  async upload(file: StoredFile): Promise<string> {
    if (!env.storage.r2.bucket || !env.storage.r2.accessKeyId) {
      console.warn("[StorageService] R2 sem credenciais — usando disco local.");
      return this.fallback.upload(file);
    }
    // TODO(real): PutObjectCommand no bucket R2 e retornar `${R2_PUBLIC_URL}/${key}`.
    // Enquanto não plugado, mantém funcional via fallback local.
    return this.fallback.upload(file);
  }
}

export const storageService: StorageService =
  env.storage.driver === "r2" ? new R2Storage() : new LocalStorage();
