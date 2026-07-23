import type { CapacitorConfig } from "@capacitor/cli";

// Empacotamento mobile (Android/iOS) do app do ENTREGADOR — estratégia server.url:
// o app nativo é um shell que carrega o Next em execução, preservando todas as
// rotas dinâmicas do App Router e o realtime (socket). Útil pro GPS/localização
// nativa mais adiante (plugin @capacitor/geolocation).
//
//  - Dev  : CAP_SERVER_URL=http://SEU_IP_LAN:3002  (ex.: http://192.168.15.2:3002) + `next dev`
//  - Prod : CAP_SERVER_URL=https://entregador.seudominio.com
//
// Fluxo:
//   1) suba o front  (pnpm dev:entregador)  ou hospede
//   2) CAP_SERVER_URL=http://IP:3002 pnpm --filter @cabana/front-entregador cap:sync
//   3) pnpm --filter @cabana/front-entregador cap:open:android
const config: CapacitorConfig = {
  appId: "com.cabanalanches.entregador",
  appName: "Cabana Entregador",
  webDir: "www",
  server: {
    url: process.env.CAP_SERVER_URL || "http://192.168.15.2:3002",
    cleartext: true, // permite http em rede local (dev). Em prod use https e remova.
  },
  backgroundColor: "#FBF7F2",
};

export default config;
