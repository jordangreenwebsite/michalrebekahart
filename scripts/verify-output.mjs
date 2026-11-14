// Run after Astro build and local asset copying. This catches broken routes before deployment.
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { entries } from '../src/data/discovery.mjs';
const paths = ['','our-story','journal','contact','commissions','privacy-policy',
  'artwork-and-commissions','artwork-guide','art-for-businesses',...entries.map(x=>x.slug)];
const problems = [];
for (const slug of paths) {
  const p = join('dist', slug, 'index.html');
  let html;
  try { html = await readFile(p, 'utf8'); }
  catch (e) { problems.push('Missing route ' + p); continue; }
  if (!/<h1\b/i.test(html)) problems.push('No H1: ' + p);
  if (!/<link rel="canonical"/i.test(html)) problems.push('No canonical: ' + p);
  if (!/<meta name="description"/i.test(html)) problems.push('No description: ' + p);
  if (slug === 'contact' && html.includes('id="contact-form118"')) problems.push('Old WP form remains on contact page');
}
for (const path of ['dist/robots.txt','dist/sitemap.xml','dist/image-sitemap.xml',
  'dist/wp-content/uploads/2026/01/story-Logo-150x150.png',
  'dist/wp-content/uploads/2026/03/IMG_6425-768x1024.jpeg']) {
  try { await access(path); } catch { problems.push('Missing static file ' + path); }
}
if (problems.length) {
  console.error('Astro output checks failed:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('Verified ' + paths.length + ' canonical HTML pages, assets, robots and sitemap.');
