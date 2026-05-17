import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      '$domain': '../../src/domain',
      '$domain/*': '../../src/domain/*',
      '$data': '../../data',
      '$data/*': '../../data/*'
    }
  }
};

export default config;
