import type { NextConfig } from "next";

const PRODUCTION_HOST = "whiskeylog.vercel.app";
const FIREBASE_AUTH_HOST = "whiskey-display-case.firebaseapp.com";
const isVercelProduction = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
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
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
