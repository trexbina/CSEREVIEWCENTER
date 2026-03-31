/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

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
