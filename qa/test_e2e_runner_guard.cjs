'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
function run(config){
 const env={...process.env,HYRAM_E2E_MODE:'prepare',HYRAM_STAGING_API_ORIGIN:'https://staging.hyram-example.test/',HYRAM_E2E_OPERATOR_TOKEN:'SYNTHETIC_TEST_ONLY',...config};
 const r=spawnSync(process.execPath,['qa/verify_payment_reservation_staging.mjs'],{env,encoding:'utf8',timeout:5000});
 return {code:r.status,output:(r.stdout||'')+(r.stderr||'')};
}
test('does not run if execution mode is absent',()=>{const r=run({HYRAM_E2E_MODE:''});assert.equal(r.code,2);assert.match(r.output,/BLOCKED/);});
test('rejects public production domain even with a token',()=>{const r=run({HYRAM_STAGING_API_ORIGIN:'https://hyramgolf.kr/'});assert.equal(r.code,2);assert.match(r.output,/production/);});
test('rejects local or unknown hosts and insecure HTTP',()=>{
 for(const url of ['http://staging.hyram-example.test/','https://localhost/','https://www.hyramgolf.kr/','https://example.com/']){
  const r=run({HYRAM_STAGING_API_ORIGIN:url});assert.equal(r.code,2,url);
 }
});
test('rejects missing staged credentials before network calls',()=>{const r=run({HYRAM_E2E_OPERATOR_TOKEN:''});assert.equal(r.code,2);assert.match(r.output,/BLOCKED/);});
