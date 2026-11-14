// Cross-width navigation check. Tests the old Breakdance header and new Astro
// header at the widths where the hero could cover the menu toggle.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const server=spawn('python3',['-m','http.server','4323','-d','dist'],{stdio:'ignore'});
const base='http://127.0.0.1:4323';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const widths=[320,375,390,600,768,1024,1119,1440];
const urls=['/','/our-story/','/contact/','/artwork-guide/','/artist-in-swindon/'];
const output='qa/navigation';
await mkdir(output,{recursive:true});
const needed=['/artwork-guide/','/art-for-businesses/','/original-oil-paintings/','/artist-in-swindon/','/artist-in-bath/','/artist-in-gloucester/','/personalised-childrens-books/'];
try{
  for(const width of widths){
    const ctx=await browser.newContext({viewport:{width,height:820},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await ctx.newPage();
    for(const path of urls){
      const response=await page.goto(base+path,{waitUntil:'load',timeout:20000});
      assert.equal(response?.status(),200,'Page renders '+path+' @'+width);
      await page.waitForTimeout(230);
      const old=path==='/'||path==='/our-story/'||path==='/contact/';
      if(old){
        const toggle=page.locator('.breakdance-menu-toggle');
        if(width<=1119){
          assert.ok(await toggle.isVisible(),'Mobile toggle visible @'+width);
          const rect=await toggle.boundingBox();
          assert.ok(rect?.width>15&&rect?.height>15,'Toggle has hit area');
          const hit=await page.evaluate(({x,y})=>{
            const el=document.elementFromPoint(x,y);
            return !!el?.closest('.breakdance-menu-toggle');
          },{x:rect.x+rect.width/2,y:rect.y+rect.height/2});
          assert.ok(hit,'Hero does not cover toggle at '+width+' on '+path);
          await toggle.click({timeout:5000});
          const summary=page.locator('.art-explore-summary').first();
          assert.ok(await summary.isVisible(),'Explore menu visible on '+path+' @'+width);
          await summary.click();
        }else{
          const summary=page.locator('.art-explore-summary').first();
          assert.ok(await summary.isVisible(),'Explore visible on desktop '+path);
          await summary.click();
        }
        const panel=page.locator('.art-explore-panel').first();
        assert.ok(await panel.isVisible(),'Explore panel opened');
        for(const dest of needed){
          assert.equal(await panel.locator('a[href="'+dest+'"]').count(),1,
            'Menu links to '+dest+' on '+path+' @'+width);
        }
        if(path==='/')await page.screenshot({path:output+'/home-'+width+'.png',animations:'disabled'});
      }else{
        if(width<951){
          const toggle=page.locator('.art-mobile-nav summary').first();
          assert.ok(await toggle.isVisible(),'Native mobile menu visible');
          await toggle.click();
          await page.locator('.art-mobile-nav .art-explore-summary').click();
          const panel=page.locator('.art-mobile-nav .art-explore-panel');
          assert.ok(await panel.isVisible(),'Native submenu visible');
          for(const dest of needed)assert.equal(await panel.locator('a[href="'+dest+'"]').count(),1);
        }else{
          const desktop=page.locator('.art-desktop-nav .art-explore-summary');
          await desktop.click();
          const panel=page.locator('.art-desktop-nav .art-explore-panel');
          assert.ok(await panel.isVisible());
          for(const dest of needed)assert.equal(await panel.locator('a[href="'+dest+'"]').count(),1);
        }
      }
      console.log('Navigation verified',path,width);
    }
    await ctx.close();
  }
}finally{
  await browser.close();
  server.kill();
}
