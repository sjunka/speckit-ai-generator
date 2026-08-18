import { fileURLToPath } from "node:url";

const config = {
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    globals: true,
    passWithNoTests: true,
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
};

export default config;
