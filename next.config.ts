import type { NextConfig } from "next";

// Expose Supabase vars to the browser when only SUPABASE_* names are set (e.g. Netlify).
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

let supabaseHostname = "";
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";
} catch {
  supabaseHostname = "";
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lenis", "@stripe/stripe-js", "@stripe/react-stripe-js"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Menu dish videos can be up to 25 MB; raise proxy buffer so uploads aren't truncated.
    proxyClientMaxBodySize: "30mb",
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : [
            {
              protocol: "https" as const,
              hostname: "**.supabase.co",
              pathname: "/storage/v1/object/public/**",
            },
          ]),
    ],
  },
};

export default nextConfig;
