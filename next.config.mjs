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

  /* ── Headers — immutable cache for static assets and security ─────────── */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.public.blob.vercel-storage.com https://*.supabase.co blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' https://www.youtube.com;",
          }
        ],
      },
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
