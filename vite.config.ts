import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { contentLastModified } from "./scripts/content-last-modified";

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Tests live next to the routes they cover, but the generator treats every file under
    // src/routes as a route candidate and warns once per test file on every build.
    tanstackStart({ router: { routeFileIgnorePattern: "\\.test\\.tsx?$" } }),
    nitro(),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    sentryTanstackStart({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  clearScreen: false,
  resolve: {
    // streamdown and class-variance-authority still import these; `cn` exports drop-in
    // twMerge/clsx, so aliasing keeps one class-merging implementation in the bundle.
    // clsx goes through a shim because `cn` has no default export and some consumers
    // (@tanstack/devtools) default-import it. See shims/clsx.ts.
    alias: { "tailwind-merge": "cn", clsx: fileURLToPath(new URL("./shims/clsx.ts", import.meta.url)) },
  },
  define: {
    __CONTENT_LAST_MODIFIED__: JSON.stringify(contentLastModified()),
  },
});

export default config;
