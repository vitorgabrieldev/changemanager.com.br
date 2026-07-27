import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Upload de fotos de imóveis (uploadPropertyImage) manda o arquivo via
      // Server Action; o default de 1mb é baixo demais pra foto de celular.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Fotos de imóveis são servidas via signed URL do Supabase Storage
    // (domínio muda por projeto/ambiente, daí o wildcard em vez do ref fixo).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
