import { createServer } from "node:http";
import { createApp } from "./app.js";
import { initSocket } from "./realtime/io.js";
import { env } from "./config/env.js";

const app = createApp();
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`\n🍔  Cabana Lanches API`);
  console.log(`    HTTP + WebSocket:  http://localhost:${env.port}`);
  console.log(`    Health:            http://localhost:${env.port}/health`);
  console.log(`    Ambiente:          ${env.nodeEnv}\n`);
});

// encerra limpo
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    console.log(`\n${sig} recebido, encerrando...`);
    httpServer.close(() => process.exit(0));
  });
}
