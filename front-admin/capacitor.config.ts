import type { CapacitorConfig } from "@capacitor/cli";

// Empacotamento mobile (Android/iOS) do painel ADMIN — estratégia server.url:
// o app nativo é um shell que carrega o Next em execução, preservando todas as
// rotas dinâmicas do App Router e o realtime (socket).
//
//  - Dev  : CAP_SERVER_URL=http://SEU_IP_LAN:3001  (ex.: http://192.168.15.2:3001) + `next dev`
//  - Prod : CAP_SERVER_URL=https://admin.seudominio.com
//
// Fluxo:
//   1) suba o front  (pnpm dev:admin)  ou hospede
//   2) CAP_SERVER_URL=http://IP:3001 pnpm --filter @cabana/front-admin cap:sync
//   3) pnpm --filter @cabana/front-admin cap:open:android
const config: CapacitorConfig = {
  appId: "com.cabanalanches.admin",
  appName: "Cabana Admin",
  webDir: "www",
  server: {
    url: process.env.CAP_SERVER_URL || "http://192.168.15.2:3001",
    cleartext: true, // permite http em rede local (dev). Em prod use https e remova.
  },
  backgroundColor: "#FBF7F2",
};

export default config;
