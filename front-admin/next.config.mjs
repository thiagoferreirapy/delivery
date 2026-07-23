/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // não redirecionar trailing slash (senão o Next faz 308 em /socket.io/ e
  // quebra o handshake do socket.io antes de chegar no rewrite)
  skipTrailingSlashRedirect: true,
  transpilePackages: ["@cabana/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
  // Proxy da API + socket + uploads pela mesma origem do front, para funcionar
  // atrás de um único túnel ngrok (o browser só fala com a origem do front).
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || "http://localhost:4000";
    return [
      { source: "/api/:path*", destination: `${target}/:path*` },
      { source: "/socket.io/", destination: `${target}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${target}/socket.io/:path*` },
      { source: "/uploads/:path*", destination: `${target}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
