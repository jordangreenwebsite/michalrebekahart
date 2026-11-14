// Build lightweight, high-quality WebP variants while keeping Mikie's
// original paintings unchanged for full-resolution viewing and download.
import sharp from 'sharp';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { entries } from '../src/data/discovery.mjs';
import { artworkThumb, landingHero } from '../src/lib/image-paths.mjs';

const root = process.cwd();
const output = join(root,'dist');
const source = path => join(root, String(path).replace(/^\//,''));
const destination = path => join(output, String(path).replace(/^\//,''));
const jobs = [];
const done = new Set();
let originalBytes = 0;
let optimizedBytes = 0;

async function convert(input, outputPath, width, quality=82) {
  if(done.has(outputPath)) return;
  done.add(outputPath);
  const from = source(input);
  const to = destination(outputPath);
  await mkdir(dirname(to),{recursive:true});
  try {
    const inputSize = (await stat(from)).size;
    const metadata = await sharp(from).metadata();
    if(!metadata.width || !metadata.height) throw new Error('No image dimensions for '+input);
    const info = await sharp(from).rotate().resize({width,withoutEnlargement:true})
      .webp({quality,effort:4}).toFile(to);
    originalBytes += inputSize;
    optimizedBytes += info.size;
    jobs.push({input,outputPath,original:inputSize,optimized:info.size,quality,width:info.width});
  } catch(e) {
    console.error('Art image conversion failed:',input,outputPath,e.message);
    throw e;
  }
}
// The homepage uses a CSS hero background. It is the likely LCP resource and
// must be explicitly preloaded in both mobile and desktop variants.
await convert('/wp-content/uploads/2026/01/8-scaled.jpg','/images/home-hero-desktop.webp',1600,79);
await convert('/wp-content/uploads/2026/01/8-scaled.jpg','/images/home-hero-mobile.webp',820,77);
await convert('/wp-content/uploads/2026/01/pexels-anete-lusina-31280510-scaled.jpg',
  '/images/artist-at-easel.webp',840,80);

const html = await readFile(join(root,'index.html'),'utf8');
const matches = [...html.matchAll(/<a\b[^>]*class="[^"]*ee-gallery-item--image[^"]*"[^>]*>[\s\S]*?<\/a>/gi)];
for(const match of matches){
  const src = match[0].match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  if(src) await convert(src,artworkThumb(src),800,82);
}
for (const entry of entries) {
  if(entry.slug === 'artwork-and-commissions') continue; // This is a separately-authored hub.
  await convert(entry.image,landingHero(entry.slug),1000,81);
}
const size = n => (n/1024).toFixed(1)+' KiB';
const hero = jobs.filter(x=>x.outputPath.includes('hero-'));
console.log('Optimized '+jobs.length+' image variants. Source total '
  +size(originalBytes)+', output total '+size(optimizedBytes)+'.');
for(const x of hero)console.log('Hero '+x.outputPath+': '+size(x.original)+' → '+size(x.optimized));
