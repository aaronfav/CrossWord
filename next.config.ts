import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/new-game": [
      "./node_modules/word-list/**",
      "./node_modules/.pnpm/**/node_modules/word-list/**",
    ],
    "/api/reveal": [
      "./node_modules/word-list/**",
      "./node_modules/.pnpm/**/node_modules/word-list/**",
    ],
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "shims/async-storage.ts",
      ),
    };
    return config;
  },
};

export default nextConfig;
