import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kalen/shared", "@kalen/identity"],
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
