import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const require = createRequire(import.meta.url);
const { version } = require("./package.json") as { version: string };
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react({ tsDecorators: true }), tailwindcss()],
  resolve: {
    alias: {
      "@dotwars/shared": path.join(repoRoot, "packages/shared/src/index.ts"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});

