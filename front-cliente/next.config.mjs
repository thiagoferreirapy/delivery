/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

export default nextConfig;
