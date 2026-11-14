// Combine the contiguous, render-blocking Breakdance page styles into a
// single stylesheet per preserved WordPress page. Keep exact CSS cascade order
// and leave all original source files untouched for comparison/rollback.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, posix } from 'node:path';

const root=process.cwd(), dist=join(root,'dist');
const routes=['','our-story','journal','commissions','contact','privacy-policy'];
const re=/<link\s+rel="stylesheet"\s+href="(\/wp-content\/uploads\/breakdance\/css\/[^"]+)"\s*\/?>/gi;
let count=0,totalOriginal=0,totalBundled=0;

function fixURLs(css, cssPath){
  return css.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi,(full,quote,url)=>{
    const value=url.trim();
    if(!value || /^(?:data:|https?:|\/\/|\/|#)/i.test(value))return full;
    const [path,...query]=value.split('?');
    const resolved=posix.resolve(posix.dirname(cssPath),path);
    return 'url("'+resolved+(query.length?'?'+query.join('?'):'')+'")';
  });
}
for(const slug of routes){
  const pathname=join(dist,slug,'index.html');
  let html=await readFile(pathname,'utf8');
  const styles=[...html.matchAll(re)].map(m=>({tag:m[0],href:m[1]}));
  if(styles.length<4)throw new Error('Expected grouped Breakdance CSS not found on '+slug+': '+styles.length);
  const parts=[];
  for(const {href} of styles){
    const path=href.split('?')[0];
    const css=await readFile(join(root,path.slice(1)),'utf8');
    totalOriginal+=Buffer.byteLength(css);
    parts.push('/* '+path+' */\n'+fixURLs(css,path)+'\n');
  }
  const output='/css/legacy-'+(slug||'home')+'.css';
  const file=join(dist,output.slice(1));
  await mkdir(dirname(file),{recursive:true});
  const content=parts.join('\n');
  await writeFile(file,content);
  totalBundled+=Buffer.byteLength(content);
  let replaced=0;
  html=html.replace(re,()=>{
    replaced++;
    return replaced===1?'<link rel="stylesheet" href="'+output+'">':'';
  });
  if(replaced!==styles.length)throw new Error('Unexpected CSS replacement count on '+slug);
  await writeFile(pathname,html);
  count++;
  console.log('Bundled '+styles.length+' cascading page styles into '+output);
}
console.log('Combined '+count+' legacy page CSS bundles, originals '
  +(totalOriginal/1024).toFixed(1)+' KiB, combined '+(totalBundled/1024).toFixed(1)+' KiB before gzip.');
