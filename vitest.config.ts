import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

import { contentLastModified } from "./scripts/content-last-modified";

export default defineConfig({
  plugins: [tsconfigPaths()],
  define: {
    __CONTENT_LAST_MODIFIED__: JSON.stringify(contentLastModified()),
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "convex",
          include: ["convex/**/*.test.ts"],
          environment: "edge-runtime",
          server: { deps: { inline: ["convex-test"] } },
        },
      },
      {
        extends: true,
        test: {
          name: "node",
          include: ["src/**/*.test.ts", "evals/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["src/test/setup-jsdom.ts"],
        },
      },
    ],
    exclude: ["**/node_modules/**", "**/.output/**", "**/dist/**", "tests/e2e/**"],
    globals: false,
    reporters: ["default"],
  },
});
