import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
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

