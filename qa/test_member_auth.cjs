const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const callback=fs.readFileSync('auth/member-callback.mjs','utf8').replace(/^import .*;\n/,'');
async function run(search,{exchangeError=null,user={id:'member'},userError=null}={}){
 const events=[];const status={};
 const client={auth:{exchangeCodeForSession:async code=>{events.push(['exchange',code]);return {error:exchangeError};},getUser:async()=>({data:{user},error:userError})}};
 const ctx={URLSearchParams,document:{querySelector:()=>status},location:{search,pathname:'/auth/member-callback.html',replace:url=>events.push(['redirect',url])},history:{replaceState:(_a,_b,path)=>events.push(['clean',path])},getMemberClient:async()=>client};
 await vm.runInNewContext('(async()=>{'+callback+'})()',ctx);
 return {events,status};
}
test('verified customer returns only to member login, never admin',async()=>{
 const r=await run('?code=valid');assert.deepEqual(r.events,[['clean','/auth/member-callback.html'],['exchange','valid'],['redirect','../login.html']]);
});
for(const search of ['', '?error=access_denied&error_description=unsafe', '?code=x&error=denied'])test('missing or denied OAuth never exchanges: '+search,async()=>{
 const r=await run(search);assert.equal(r.events.length,1);assert.match(r.status.textContent,/완료하지 못했습니다/);
});
for(const opts of [{exchangeError:new Error('expired')},{user:null},{userError:new Error('invalid')}])test('invalid code or unverified user never redirects',async()=>{
 const r=await run('?code=bad',opts);assert(!r.events.some(e=>e[0]==='redirect'));assert.match(r.status.textContent,/완료하지 못했습니다/);
});
test('customer provider switches are fail closed pending real OAuth tests',async()=>{
 const {socialProviders}=await import('../auth/social-config.mjs');
 assert.equal(socialProviders.kakao.id,'kakao');assert.equal(socialProviders.facebook.id,'facebook');assert.equal(socialProviders.naver.id,'custom:naver');
 assert(Object.values(socialProviders).every(p=>p.enabled===false));
});
