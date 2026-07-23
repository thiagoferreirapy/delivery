import type { CapacitorConfig } from "@capacitor/cli";

// Empacotamento mobile (Android/iOS) do app do CLIENTE — estratégia server.url:
// o app nativo é um shell que carrega o Next em execução, preservando todas as
// rotas dinâmicas do App Router e o realtime (socket).
//
//  - Dev  : CAP_SERVER_URL=http://SEU_IP_LAN:3000  (ex.: http://192.168.15.2:3000) + `next dev`
//  - Prod : CAP_SERVER_URL=https://cliente.seudominio.com
//
// Fluxo:
//   1) suba o front  (pnpm dev:cliente)  ou hospede
//   2) CAP_SERVER_URL=http://IP:3000 pnpm --filter @cabana/front-cliente cap:sync
//   3) pnpm --filter @cabana/front-cliente cap:open:android   (abre no Android Studio)
const config: CapacitorConfig = {
  appId: "com.cabanalanches.cliente",
  appName: "Cabana Lanches",
  // webDir é o fallback estático (tela de "conectando"). Com server.url o app
  // carrega da URL; o Capacitor ainda exige que este diretório exista.
  webDir: "www",
  server: {
    url: process.env.CAP_SERVER_URL || "http://192.168.15.2:3000",
    cleartext: true, // permite http em rede local (dev). Em prod use https e remova.
  },
  backgroundColor: "#FBF7F2",
};

export default config;
