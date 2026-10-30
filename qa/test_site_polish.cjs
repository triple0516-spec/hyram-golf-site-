'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,375,390,768,1280]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const file of ['index.html','catalog.html','lesson.html','faq.html','policies.html','refund.html','404.html']){
    await page.goto('http://127.0.0.1:8765/'+file,{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' overflow @'+width);
    if(file!=='404.html'){
     assert.equal(await page.locator('#main-content').count(),1);
     assert.equal(await page.locator('link[rel=canonical]').count(),1);
    }
    if(file==='index.html'){
     if(width<=900){
      await page.locator('.hyram-menu-toggle').click();
      assert.equal(await page.locator('#hyram-navigation').isVisible(),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#hyram-navigation').isVisible(),false);
     }
     await page.getByRole('button',{name:'서울',exact:true}).click();
     assert.equal(await page.getByRole('button',{name:'서울',exact:true}).getAttribute('aria-pressed'),'true');
     assert.match(await page.locator('#ccDetails').innerText(),/직접 입력/);
     await page.locator('#service').selectOption('피팅');
     await page.locator('#name').fill('테스트');
     await page.locator('#contact').selectOption('전화');
     await page.locator('#phone').fill('010-0000-0000');
     assert.equal(await page.locator('#phone').inputValue(),'01000000000');
     await page.locator('#privacy').check();
     await page.locator('button[type=submit]').press('Enter');
     assert.equal(await page.locator('#done').isVisible(),true);
     await page.locator('#memo').fill('수정된 테스트 초안');
     assert.equal(await page.locator('#done').isVisible(),false);
    }
    if(file==='catalog.html'){
     await page.locator('#search').fill('no-product-1234');
     assert.match(await page.locator('#count').innerText(),/검색 결과가 없습니다/);
     await page.locator('#hyram-reset-filters').click();
     assert.equal(await page.locator('#search').inputValue(),'');
     assert.match(await page.locator('#count').innerText(),/개 상품/);
    }
   }
   assert.deepEqual(errors,[]);
   console.log('PASS customer pages, menu, draft and filters @'+width);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
