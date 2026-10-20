import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/lib/**/*.ts",
        "src/app/api/auth/**/route.ts",
        "src/app/api/health/route.ts",
        "src/app/api/pos/canje/validar/route.ts",
        "src/app/api/socio/canje/route.ts",
        "src/app/api/socio/encuesta/**/route.ts",
        "src/app/api/visitas/\\[id\\]/route.ts",
        "src/app/api/pos/socios/alta/route.ts",
        "src/app/api/admin/socios/route.ts",
      ],
      exclude: ["src/lib/prisma.ts"],
    },
  },
});
