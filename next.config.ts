import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Upload de fotos de imóveis (uploadPropertyImage) manda o arquivo via
      // Server Action; o default de 1mb é baixo demais pra foto de celular.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
