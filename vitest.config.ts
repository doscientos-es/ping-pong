import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'resolve-pwa-test-module',
      // The tests mock this virtual module; real service workers require a browser.
      resolveId(id) {
        if (id === 'virtual:pwa-register/react') return id
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Limit concurrent jsdom instances to avoid CPU contention on UI query deadlines.
    maxWorkers: 4,
    testTimeout: 15000,
  },
})
