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
     assert.equal(await page.locator(file==='refund.html'?'#main':'#main-content').count(),1);
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
     // The short form must never require identity or automatically send a request.
     await page.locator('[data-customer-kind="피팅"]').click();
     assert.equal(await page.locator('#customer-kind').inputValue(),'피팅');
     await page.locator('#customer-message').fill('아이언이 제 스윙에 맞는지 궁금해요.');
     await page.locator('#customer-form button[type=submit]').click();
     assert.match(await page.locator('#customer-draft').inputValue(),/아이언이 제 스윙/);
     assert.match(await page.locator('#customer-status').innerText(),/아직 접수된 상태는 아니에요/);
     assert.equal(await page.locator('.customer-chat').getAttribute('href'),'https://open.kakao.com/o/gaQIRfSi');
     await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('clipboard denied')};});
     await page.locator('#customer-copy').click();
     await page.waitForFunction(()=>document.querySelector('#customer-status').textContent.includes('자동 복사가 제한'));
     assert.equal(await page.locator('#customer-draft').isVisible(),true);
     await page.locator('#customer-message').fill('드라이버로 변경');
     assert.equal(await page.locator('#customer-draft-panel').isHidden(),true);
     assert.equal(await page.locator('.customer-detailed').getAttribute('open'),null);
     await page.locator('.customer-detailed summary').click();
     await page.locator('#service').selectOption('피팅');
     await page.locator('#name').fill('테스트');
     await page.locator('#contact').selectOption('전화');
     await page.locator('#phone').fill('010-0000-0000');
     assert.equal(await page.locator('#phone').inputValue(),'01000000000');
     await page.locator('#privacy').check();
     await page.locator('#requestForm button[type=submit]').press('Enter');
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
