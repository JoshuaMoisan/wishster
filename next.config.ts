import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  // En dev, Next bloque les assets /_next si Origin n’est pas localhost ; Spotify exige 127.0.0.1 en redirect.
  allowedDevOrigins: ["127.0.0.1", "[::1]"],
};

export default nextConfig;
