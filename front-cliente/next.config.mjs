/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // não redirecionar trailing slash (senão o Next faz 308 em /socket.io/ e
  // quebra o handshake do socket.io antes de chegar no rewrite)
  skipTrailingSlashRedirect: true,
  // consome o pacote shared (TS) direto do monorepo
  transpilePackages: ["@cabana/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "api.qrserver.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  webpack(config) {
    // Permite que imports ESM com extensão `.js` (do pacote @cabana/shared em TS)
    // resolvam para os arquivos `.ts`/`.tsx` correspondentes.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
  // Proxy da API + socket + uploads pela mesma origem do front. Assim o app
  // funciona por qualquer host (localhost, IP da LAN ou ngrok) usando um único
  // túnel — o browser só fala com a origem do front.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || "http://localhost:4000";
    return [
      { source: "/api/:path*", destination: `${target}/:path*` },
      // literal com a barra final (o engine.io bate sempre em /socket.io/)
      { source: "/socket.io/", destination: `${target}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${target}/socket.io/:path*` },
      { source: "/uploads/:path*", destination: `${target}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
