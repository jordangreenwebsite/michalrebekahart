import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.michalrebekahart.co.uk',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' }
});
