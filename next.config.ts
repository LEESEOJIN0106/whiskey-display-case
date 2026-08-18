import type { NextConfig } from "next";

const PRODUCTION_HOST = "whiskeylog.vercel.app";
const FIREBASE_AUTH_HOST = "whiskey-display-case.firebaseapp.com";
const isVercelProduction = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
  },
  env: isVercelProduction
    ? {
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: PRODUCTION_HOST,
        NEXT_PUBLIC_SITE_URL: `https://${PRODUCTION_HOST}`,
      }
    : {},
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/__/auth/:path*",
          destination: `https://${FIREBASE_AUTH_HOST}/__/auth/:path*`,
        },
        {
          source: "/__/firebase/:path*",
          destination: `https://${FIREBASE_AUTH_HOST}/__/firebase/:path*`,
        },
      ],
    };
  },
  async headers() {
    const coopAllowPopups = [
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
    ];
    const coopUnsafeNone = [
      {
        key: "Cross-Origin-Opener-Policy",
        value: "unsafe-none",
      },
    ];

    return [
      {
        source: "/",
        headers: coopAllowPopups,
      },
      {
        source: "/:path((?!__/auth|__/firebase).*)",
        headers: coopAllowPopups,
      },
      {
        source: "/login-cellar.jpg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/__/auth/:path*",
        headers: coopUnsafeNone,
      },
      {
        source: "/__/firebase/:path*",
        headers: coopUnsafeNone,
      },
    ];
  },
};

export default nextConfig;
