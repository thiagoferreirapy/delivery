import type { CapacitorConfig } from "@capacitor/cli";

// Empacotamento mobile (Android/iOS) do app do cliente.
// Estratégia: apontar para o app Next.js servido (dev: LAN; prod: URL hospedada),
// preservando os recursos dinâmicos do App Router.
//
// Passos para gerar o app nativo (quando quiser):
//   1) pnpm --filter @cabana/front-cliente build   (ou rode `next dev`/deploy)
//   2) ajuste `server.url` abaixo para o IP/host acessível pelo device
//   3) pnpm --filter @cabana/front-cliente cap:add:android
//   4) npx cap sync && npx cap open android
const config: CapacitorConfig = {
  appId: "com.cabanalanches.cliente",
  appName: "Cabana Lanches",
  // webDir só é usado em modo estático; com server.url o app carrega da URL.
  webDir: "public",
  server: {
    // Em dev, troque para http://SEU_IP_LAN:3000 e rode `next dev`.
    // Deixe comentado para builds estáticos.
    url: process.env.CAP_SERVER_URL || "http://localhost:3000",
    cleartext: true,
  },
  backgroundColor: "#FBF7F2",
};

export default config;
