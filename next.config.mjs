/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.canva.com" },
      { protocol: "https", hostname: "**.canva.cn" },
    ],
  },
};

export default nextConfig;
