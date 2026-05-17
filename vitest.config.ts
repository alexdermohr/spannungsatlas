import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      $domain: resolve(__dirname, 'src/domain'),
      $lib: resolve(__dirname, 'apps/web/src/lib'),
      $data: resolve(__dirname, 'data')
    }
  }
});
