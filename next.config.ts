import type { NextConfig } from "next";
import path from "path";

const hostedManifestId =
  process.env.FARCASTER_HOSTED_MANIFEST_ID ??
  process.env.NEXT_PUBLIC_FARCASTER_HOSTED_MANIFEST_ID ??
  "";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/new-game": [
      "./app/assets/word-list/**",
    ],
    "/api/reveal": [
      "./app/assets/word-list/**",
    ],
  },
  async redirects() {
    if (!hostedManifestId) {
      console.warn(
        "[farcaster] FARCASTER_HOSTED_MANIFEST_ID not set; skipping hosted manifest redirect.",
      );
      return [];
    }
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: `https://api.farcaster.xyz/miniapps/hosted-manifest/${hostedManifestId}`,
        permanent: false,
      },
    ];
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
