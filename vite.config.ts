import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  define: { CESIUM_BASE_URL: JSON.stringify('/cesium/') },
  server: { port: 5176, strictPort: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
