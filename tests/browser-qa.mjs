// Real browser QA of Astro output, run in GitHub Actions with Chromium.
// Screenshots are saved as workflow artifacts for review.
// This is a functional and layout smoke test, not a claim of pixel-perfect matching.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const port = 4321;
const base = 'http://127.0.0.1:' + port;
const server = spawn('python3', ['-m','http.server',String(port),'-d','dist'], {stdio:'ignore'});
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
let browser;
const report = [];
const out = 'qa/screenshots';
await mkdir(out,{recursive:true});
const goto = async (page,path) => {
  const r=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:20000});
  assert.equal(r?.status(),200,'HTTP 200 '+path);
  const n=await page.locator('h1').count();
  assert.equal(n,1,'Exactly one H1 '+path);
  const canonical=await page.locator('link[rel=canonical]').getAttribute('href');
  assert.ok(canonical?.startsWith('https://www.michalrebekahart.co.uk/'),'Canonical '+path);
};
try {
  await wait(1200);
  browser = await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const viewport of [{width:1440,height:900,name:'desktop'},{width:390,height:844,name:'mobile'}]){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();
    const routes=['/','/our-story/','/journal/','/commissions/','/contact/',
      '/artwork-and-commissions/','/artwork-guide/','/art-for-businesses/',
      '/artist-in-swindon/','/family-painting-commissions/'];
    for(const route of routes){
      await goto(page,route);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      if(overflow>6) {
        const offenders=await page.evaluate(()=>{
          const right=window.innerWidth;
          return [...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>right+6)
            .slice(0,12).map(el=>({tag:el.tagName,cls:el.className?.toString().slice(0,90),
              right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)}));
        });
        console.warn('OVERFLOW DIAG',viewport.name,route,overflow,JSON.stringify(offenders));
      }
      const limit=['/','/our-story/','/journal/','/commissions/','/contact/','/privacy-policy/'].includes(route)?24:6;
      assert.ok(overflow<=limit,'No unexpected horizontal overflow '+route+' ('+overflow+'px)');
      report.push(viewport.name+' '+route+' rendered');
    }
    await goto(page,'/');
    const galleryCount=await page.locator('.ee-gallery-item--image').count();
    assert.ok(galleryCount>=30,'Original paintings still visible in homepage gallery: '+galleryCount);
    await page.locator('.ee-gallery-item--image[data-artwork-open]').first().click();
    const originalLightbox=page.locator('dialog.mra-lightbox[open]');
    await originalLightbox.waitFor({timeout:7000});
    assert.ok((await page.locator('.mra-lightbox-title').innerText()).length>10,'Artwork has a visible descriptive title');
    assert.ok((await page.locator('.mra-lightbox-description').innerText()).length>10,'Artwork has its real-world description');
    await page.locator('.mra-lightbox-close').click();
    await originalLightbox.waitFor({state:'hidden'});
    await page.screenshot({path:out+'/rebuilt-home-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
    await goto(page,'/artwork-guide/');
    const captionCount=await page.locator('.artwork-card figcaption').count();
    assert.equal(captionCount,32,'32 visible artwork descriptions');
    assert.equal(await page.locator('.artwork-caption-title').count(),32,'Every painting has visible editorial title');
    assert.equal(await page.locator('.artwork-caption-detail').count(),32,'Every painting has factual description');
    await page.locator('.artwork-card [data-artwork-open]').first().click();
    const guideModal=page.locator('dialog.mra-lightbox[open]');
    await guideModal.waitFor({timeout:7000});
    assert.ok((await page.locator('.mra-lightbox-picture').getAttribute('src')).includes('IMG_6425'));
    await page.keyboard.press('Escape');
    await guideModal.waitFor({state:'hidden'});
    await page.screenshot({path:out+'/artwork-guide-'+viewport.name+'.png',fullPage:true,animations:'disabled'});
    if(viewport.name==='desktop'){
      // Check larger artwork links and genuine alt descriptions.
      const firstAlt=await page.locator('.artwork-card img').first().getAttribute('alt');
      assert.ok(firstAlt?.includes('straw hat'),'First painting has accurate alt');
      const artworkImages=await page.locator('.artwork-card img').count();
      assert.equal(artworkImages,32);
    }
    await goto(page,'/contact/');
    await page.route('**/api/contact', async route=>{
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,message:'Thank you. Your message has been sent.'})});
    });
    const visibility=await page.locator('#art-name').evaluate(el=>{
      const chain=[];
      let item=el;
      while(item&&chain.length<9){
        const st=getComputedStyle(item),r=item.getBoundingClientRect();
        chain.push({tag:item.tagName,cls:item.className,id:item.id,
          display:st.display,visibility:st.visibility,opacity:st.opacity,
          rect:{w:r.width,h:r.height,top:r.top}});
        item=item.parentElement;
      }
      return chain;
    });
    console.log('CONTACT FIELD STYLE DIAG',viewport.name,JSON.stringify(visibility));
    await page.locator('#art-name').fill('Test visitor',{timeout:6000});
    await page.locator('#art-email').fill('visitor@example.com');
    await page.locator('#art-message').fill('Could you tell me about a personalised family painting?');
    await page.locator('#rebekah-contact-form button[type=submit]').click();
    await page.locator('#art-form-status[data-sent=true]').waitFor({timeout:7000});
    report.push(viewport.name+' contact form client flow passed');
    // Optional external reference capture for a human visual comparison.
    if(viewport.name==='desktop'){
      const original=await context.newPage();
      try {
        const response=await original.goto('https://www.michalrebekahart.co.uk/',{waitUntil:'domcontentloaded',timeout:18000});
        if(response?.ok()){
          await original.screenshot({path:out+'/original-home-desktop.png',fullPage:true,animations:'disabled'});
          const referenceH1=await original.locator('h1').first().innerText();
          report.push('Live reference screenshot captured. H1: '+referenceH1.replace(/\s+/g,' ').slice(0,80));
        }else report.push('Live reference unavailable: HTTP '+response?.status());
      }catch(e){ report.push('Live reference unavailable: '+String(e).slice(0,110)); }
      await original.close();
    }
    await context.close();
  }
  console.log(report.join('\n'));
} finally {
  if(browser) await browser.close();
  server.kill();
}
