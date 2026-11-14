import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const site = 'https://www.michalrebekahart.co.uk';
const html = readFileSync(join(process.cwd(),'index.html'),'utf8');
const originals = [...html.matchAll(/<a\b[^>]*\bee-gallery-item--image[^>]*href="([^"]+)"/g)]
  .map(x=>x[1]).filter(x=>x.startsWith('/wp-content/uploads/'));
const images=[...new Set(originals)];
const escapeXml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const GET=()=>new Response(
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
  + '<url><loc>'+site+'/artwork-guide/</loc>\n'
  + images.map(p=>'<image:image><image:loc>'+escapeXml(site+p)+'</image:loc></image:image>').join('\n')
  + '\n</url></urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}}
);
