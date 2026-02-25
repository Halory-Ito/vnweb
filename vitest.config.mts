import react from '@vitejs/plugin-react'
import { webdriverio } from '@vitest/browser-webdriverio'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['app/**/*.{ts,tsx}'],
      // exclude: ['**/node_modules/**', '**/dist/**', '**/test/**'],
    },
    browser: {
      enabled: true,
      provider: webdriverio(),
      instances: [
        {
          browser: 'edge',
        },
      ],
    },
  },
})
