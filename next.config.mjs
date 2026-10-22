import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: __dirname,

  /* ── Images: Allow Vercel Blob & Supabase storage domains ─── */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /* ── Bundle optimizations ────────────────────────────────── */
  experimental: {
    // Tree‑shake barrel files so only used exports ship to the client
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "motion/react",
      "@base-ui/react",
      "radix-ui",
      "recharts",
      "class-variance-authority",
      "next-themes",
      "lottie-web",
    ],
  },

  /* ── Compiler options ────────────────────────────────────── */
  compiler: {
    // Remove console.log in production builds
    removeConsole: process.env.NODE_ENV === "production",
  },

  /* ── Headers — immutable cache for static assets ─────────── */
  async headers() {
    return [
      {
        source: "/peakassestsimage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

// Initialize Cloudflare context for local dev bindings
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
