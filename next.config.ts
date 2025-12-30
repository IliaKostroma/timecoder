import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убрали COOP/COEP заголовки - они были нужны только для FFmpeg.wasm
};

export default nextConfig;
