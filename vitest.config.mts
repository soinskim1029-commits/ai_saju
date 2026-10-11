import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // 테스트는 서버 환경에서 돈다. server-only 가드는 Next 빌드에서만 의미가 있다.
      "server-only": fileURLToPath(new URL("./test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: process.env.EVAL ? ["eval/**/*.eval.ts"] : ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
