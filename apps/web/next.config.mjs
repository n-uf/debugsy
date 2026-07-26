import { nextMonorepoPaths } from "../../scripts/next-monorepo-paths.mjs";

const { outputFileTracingRoot, turbopackRoot } = nextMonorepoPaths(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot,
  transpilePackages: [
    "@n-uf/pdf-doodl",
    "@n-uf/pdf-doodl-react",
    "@workspace/debugsy",
    "@workspace/harbuz",
  ],
  turbopack: {
    root: turbopackRoot,
  },
};

export default nextConfig;
