import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/analise-instagram",
        destination: "/novo-plano",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
