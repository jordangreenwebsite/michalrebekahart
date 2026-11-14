// Run after Astro build and local asset copying. This catches broken routes before deployment.
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { entries } from '../src/data/discovery.mjs';
const paths = ['','our-story','journal','contact','commissions','privacy-policy',
  'artwork-and-commissions','artwork-guide','art-for-businesses',...entries.map(x=>x.slug)];
const problems = [];
const titleMap = new Map();
const canonicalSite = 'https://www.michalrebekahart.com';
for (const slug of paths) {
  const p = join('dist', slug, 'index.html');
  let html;
  try { html = await readFile(p, 'utf8'); }
  catch (e) { problems.push('Missing route ' + p); continue; }
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
    .replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim() || '';
  if (!title) problems.push('No title: '+p);
  else {
    if (titleMap.has(title)) problems.push('Duplicate title: '+title+' on '+p+' and '+titleMap.get(title));
    else titleMap.set(title,p);
    if(title.length<30||title.length>68)console.warn('Review title length:',p,title.length,title);
  }
  if (!/<h1\b/i.test(html)) problems.push('No H1: ' + p);
  const expectedCanonical = canonicalSite + '/' + (slug ? slug + '/' : '');
  const canonicals = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)];
  if (canonicals.length !== 1 || !canonicals[0][0].includes('href="'+expectedCanonical+'"'))
    problems.push('Bad canonical ('+canonicals.length+'): '+p+' expected '+expectedCanonical);
  if (!/<meta name="description"/i.test(html)) problems.push('No description: ' + p);
  const ogTitles = [...html.matchAll(/<meta\s+property=["']og:title["']/gi)].length;
  if (ogTitles !== 1)problems.push('Expected one OG title, got '+ogTitles+': '+p);
  if (html.includes('https://www.michalrebekahart.co.uk')) problems.push('Old domain still in output: '+p);
  if (slug === 'contact' && html.includes('id="contact-form118"')) problems.push('Old WP form remains on contact page');
}
for (const path of ['dist/robots.txt','dist/sitemap.xml','dist/image-sitemap.xml',
  'dist/wp-content/uploads/2026/01/story-Logo-150x150.png',
  'dist/wp-content/uploads/2026/03/IMG_6425-768x1024.jpeg',
  'dist/images/home-hero-desktop.webp','dist/images/home-hero-mobile.webp',
  'dist/images/artist-at-easel.webp','dist/images/artwork/2026-03-IMG_6425-768x1024.webp',
  'dist/images/landing/artist-in-cirencester.webp']) {
  try { await access(path); } catch { problems.push('Missing static file ' + path); }
}

const sitemap = await readFile('dist/sitemap.xml','utf8');
if(!sitemap.includes(canonicalSite+'/'))problems.push('Sitemap does not use the .com site');
if(sitemap.includes('michalrebekahart.co.uk'))problems.push('Old .co.uk in sitemap');
const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
if(new Set(locations).size!==locations.length)problems.push('Duplicate sitemap URLs');
const robots = await readFile('dist/robots.txt','utf8');
if(robots.includes('.co.uk'))problems.push('Old domain in robots.txt');

if (problems.length) {
  console.error('Astro output checks failed:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('Verified ' + paths.length + ' canonical HTML pages, assets, robots and sitemap.');
