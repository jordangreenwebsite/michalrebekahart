// Repeatable, *diagnostic* mobile LCP sample on the built Astro output.
// Chromium network/CPU throttling is not the official Google Lighthouse score.
// It identifies the current LCP element and verifies our responsive assets load.
// Final score must be retested on public .com after deployment.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const port=4341, base='http://127.0.0.1:'+port;
const server=spawn('python3',['-m','http.server',String(port),'-d','dist'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
  await sleep(1000);
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const ctx=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,
    hasTouch:true,reducedMotion:'reduce',cacheEnabled:false
  });
  const page=await ctx.newPage();
  await page.addInitScript(()=>{
    window.__mraLcp=null;
    try{
      new PerformanceObserver(list=>{
        for(const entry of list.getEntries()){
          window.__mraLcp={
            time:Math.round(entry.startTime),
            name:entry.url||null,
            element:entry.element ? entry.element.tagName+' '+(entry.element.className||'').toString().slice(0,110) : null,
            size:entry.size
          };
        }
      }).observe({type:'largest-contentful-paint',buffered:true});
    } catch{}
  });
  const cdp=await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{
    offline:false,latency:150,downloadThroughput:180*1024,uploadThroughput:80*1024
  });
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const response=await page.goto(base+'/',{waitUntil:'load',timeout:90000});
  assert.equal(response?.status(),200);
  await sleep(2000);
  const report=await page.evaluate(()=>{
    const res=performance.getEntriesByType('resource');
    return {
      lcp:window.__mraLcp,
      fontMetrics:(()=>{
        const h=document.querySelector('.bde-heading-27-216');
        if(!h)return null;
        const canvas=document.createElement('canvas').getContext('2d');
        const text='Watercolour Artist in the Cotswolds';
        canvas.font='500 48px "Playfair Display"';
        const playfairWidth=canvas.measureText(text).width;
        canvas.font='500 48px Georgia';
        const georgiaWidth=canvas.measureText(text).width;
        const rect=h.getBoundingClientRect();
        const clone=h.cloneNode(true);
        clone.style.cssText='position:absolute;top:-10000px;left:0;visibility:hidden;width:'+rect.width+'px;font-family:Georgia,serif!important;';
        document.body.appendChild(clone);
        const fallbackHeight=clone.getBoundingClientRect().height;
        clone.remove();
        return {playfairLoaded:document.fonts.check('500 48px "Playfair Display"'),
          playfairWidth,georgiaWidth,relativeWidth:playfairWidth/georgiaWidth,
          headingHeight:rect.height,georgiaHeadingHeight:fallbackHeight};
      })(),

      document:performance.getEntriesByType('navigation')[0]?.duration,
      heroBackground:getComputedStyle(document.querySelector('.bde-section-27-100')).backgroundImage,
      hasMobilePreload:!!document.querySelector('link[rel="preload"][href="/images/home-hero-mobile.webp"]'),
      loadedPreviewImages:[...document.querySelectorAll('.mra-curated-gallery img')].slice(0,4).map(x=>x.currentSrc),
      resources:res.filter(x=>/home-hero|8-scaled|artist-at-easel|fonts.googleapis|font/.test(x.name))
        .map(x=>({url:x.name.split('/').slice(-2).join('/'),transfer:x.transferSize,duration:Math.round(x.duration)}))
    };
  });
  if(!report.hasMobilePreload)throw new Error('Missing mobile LCP preload');
  if(!report.heroBackground.includes('home-hero-mobile.webp'))
    throw new Error('Homepage uses unoptimized background image: '+report.heroBackground);
  if(report.loadedPreviewImages.some(x=>x && !x.endsWith('.webp')))
    throw new Error('Gallery is loading original JPEG thumbnails instead of WebP');
  await mkdir('qa',{recursive:true});
  await writeFile('qa/mobile-performance.json',JSON.stringify(report,null,2)+'\n');
  console.log('Controlled mobile diagnostic:',JSON.stringify(report,null,2));
  await ctx.close();
}finally{
  if(browser)await browser.close();
  server.kill();
}
