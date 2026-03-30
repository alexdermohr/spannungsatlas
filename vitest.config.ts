import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      $domain: resolve(__dirname, 'src/domain'),
      $lib: resolve(__dirname, 'apps/web/src/lib')
    }
  }
});
