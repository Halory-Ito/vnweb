import react from "@vitejs/plugin-react";
import { webdriverio } from "@vitest/browser-webdriverio";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/addOns/**"],
    coverage: {
      enabled: true,
      provider: "v8",
      include: [
        "app/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.d.ts",
        "**/addOns/**",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "test/api/**/*.test.ts",
            "test/api/**/*.test.tsx",
            "test/lib/**/*.test.ts",
            "test/lib/**/*.test.tsx",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: [
            "test/app/**/*.test.tsx",
          ],
          browser: {
            enabled: true,
            provider: webdriverio(),
            instances: [
              {
                browser: "edge",
              },
            ],
          },
        },
      },
    ],
  },
});
