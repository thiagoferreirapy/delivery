import "dotenv/config";

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Env faltando: ${name}`);
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: num("PORT", 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  databaseUrl: req("DATABASE_URL", "file:./dev.db"),

  jwt: {
    accessSecret: req("JWT_ACCESS_SECRET", "dev-access-secret"),
    refreshSecret: req("JWT_REFRESH_SECRET", "dev-refresh-secret"),
    accessTtl: num("JWT_ACCESS_TTL", 900),
    refreshTtl: num("JWT_REFRESH_TTL", 1209600),
  },

  storage: {
    driver: process.env.STORAGE_DRIVER ?? "local",
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:4000",
    r2: {
      accountId: process.env.R2_ACCOUNT_ID ?? "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      bucket: process.env.R2_BUCKET ?? "",
      publicUrl: process.env.R2_PUBLIC_URL ?? "",
    },
  },

  pix: {
    driver: process.env.PIX_DRIVER ?? "mock",
    autoConfirmMs: num("PIX_AUTO_CONFIRM_MS", 5000),
    apiKey: process.env.PIX_API_KEY ?? "",
  },

  maps: {
    driver: process.env.MAPS_DRIVER ?? "mock",
    apiKey: process.env.MAPS_API_KEY ?? "",
  },

  push: {
    driver: process.env.PUSH_DRIVER ?? "mock",
  },

  deliveryFee: num("DELIVERY_FEE", 7.9),

  // Fuso da loja. Os horários de funcionamento são "HH:MM" no relógio da loja,
  // então precisam ser avaliados neste fuso — não no do servidor (que em produção
  // costuma ser UTC e faria a loja abrir na hora errada).
  storeTimezone: process.env.STORE_TIMEZONE ?? "America/Sao_Paulo",
};
