import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/CJS document parsers out of the bundle (run on the server).
  serverExternalPackages: ["pdf-parse", "mammoth", "tesseract.js"],
};

export default nextConfig;
