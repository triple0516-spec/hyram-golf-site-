'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const base='http://127.0.0.1:8765/';
fs.mkdirSync('qa/screenshots',{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true});
try{
 for(const width of [375,390,1280]){
  const page=await browser.newPage({viewport:{width,height:812},deviceScaleFactor:1});
  let errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const filename of ['index.html','catalog.html','policies.html']){
   const resp=await page.goto(base+filename,{waitUntil:'networkidle'});
   if(!resp||!resp.ok())throw Error(filename+' HTTP error');
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(filename+' horizontal overflow at '+width);
   if(filename==='index.html'){
    const heroImage=page.locator('.expert-visual img');
    if(!await heroImage.evaluate(img=>img.complete && img.naturalWidth>0))throw Error('Fitter photo did not load at '+width);
    await page.screenshot({path:path.join('qa/screenshots',width+'-home-closed.png')});
   }
   const launch=page.locator('#hc-launcher'),panel=page.locator('#hc-widget');
   if(!await launch.isVisible())throw Error(filename+' launcher missing '+width);
   await launch.click();
   if(!await panel.isVisible())throw Error(filename+' cannot open chat '+width);
   if(await page.locator('#hc-quick button').count()!==6)throw Error('six guided topics missing');
   await page.screenshot({path:path.join('qa/screenshots',width+'-'+filename+'.png')});
   if(filename==='index.html'){
    const brand=page.locator('.site-brand-mark');
    if(!await brand.evaluate(img => img.complete && img.naturalWidth > 0))throw Error('Official H brand icon failed to load');
    if(await page.locator('#expert-hero-title').count()!==1 || await page.locator('#master-fitter').count()!==1)throw Error('Expert landing sections missing');
    if(await page.locator('.expert-account a[href="signup.html"]').count()!==1)throw Error('Signup navigation missing');
   }
   if(filename==='index.html'){
    await page.locator('[data-topic="club"]').click();
    if(!await page.locator('#hc-chat-scroll a[href="catalog.html"]').last().isVisible())throw Error('club guidance catalog link missing');
    await page.locator('#hc-input').fill('레슨 받고 싶어요');
    await page.locator('#hc-send').click();
    if(!await page.locator('#hc-chat-scroll a[href="index.html#reserve"]').last().isVisible())throw Error('guided question failed');
   }
   await page.keyboard.press('Escape');
   if(await panel.isVisible())throw Error(filename+' Escape close broken');
   console.log('PASS concierge '+filename+' @'+width);
  }
  await page.goto(base+'shop.html',{waitUntil:'networkidle'});
  await page.waitForURL(/catalog\.html/,{timeout:9000});
  if(!await page.locator('.product').count())throw Error('Shop redirect has no products');
  const total=await page.locator('.product:not([hidden])').count();
  await page.locator('#search').fill('hyram-very-unlikely-golf-model-x903');
  if(await page.locator('.product:not([hidden])').count()!==0)throw Error('Shop search filter broken');
  await page.locator('#search').fill('');
  if(await page.locator('.product:not([hidden])').count()!==total)throw Error('Shop filter recovery broken');
  await page.locator('.product .inquire').first().click();
  await page.waitForURL(/index\.html#reserve/,{timeout:9000});
  const memo=await page.locator('#memo').inputValue();
  if(!memo.includes('문의 상품:'))throw Error('Shop to homepage inquiry transfer broken');
  if(errors.length)throw Error('JS errors '+width+': '+errors.join('|'));
  console.log('PASS Shop filter and consult handoff @'+width+'px');
  await page.close();
 }
}finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
