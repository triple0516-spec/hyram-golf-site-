import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.mjs";

const ORIGIN="https://hyramgolf.kr";
function req(path,body=null,origin=ORIGIN){
 return new Request("https://api.example.test"+path,{
 method:body===null?"GET":"POST",
 headers:{"Origin":origin,...(body===null?{}:{"Content-Type":"application/json"})},
 ...(body===null?{}:{body:JSON.stringify(body)})
 });
}
function env(custom={}){
 return {RATE_LIMIT:{limit:async()=>({success:true})},OPENAI_API_KEY:"dummy",
 PORTONE_STORE_ID:"store-test",PORTONE_CHANNEL_KEY:"channel-test",PORTONE_API_SECRET:"dummy",
 ...custom};
}
test("fail closed with no secrets or identity infrastructure",async()=>{
 const no={};
 assert.equal((await worker.fetch(req("/api/chat",{message:"클럽?"}),no)).status,503);
 assert.equal((await worker.fetch(req("/api/identity/start",{consent:true}),no)).status,503);
 const health=await worker.fetch(req("/health"),no);
 assert.deepEqual(await health.json(),{status:"ok",chatReady:false,identityReady:false});
 assert.equal(health.headers.get("access-control-allow-origin"),ORIGIN);
});
test("origin is checked before accepting chat or verification",async()=>{
 const reply=await worker.fetch(req("/api/chat",{message:"안녕"},"https://attacker.example"),env());
 assert.equal(reply.status,403);
 assert.equal(reply.headers.get("access-control-allow-origin"),null);
});
test("chat limits payload, calls OpenAI with store false and returns parsed answer",async()=>{
 const old=globalThis.fetch;let called=false;
 globalThis.fetch=async(url,options)=>{
  called=true;
  assert.equal(url,"https://api.openai.com/v1/responses");
  const payload=JSON.parse(options.body);
  assert.equal(payload.store,false);
  assert.equal(payload.input.at(-1).content,"드라이버?");
  assert.equal(payload.max_output_tokens,500);
  return new Response(JSON.stringify({output:[{type:"message",content:[{type:"output_text",text:"샤프트와 로프트를 먼저 확인해요."}]}]}),{status:200});
 };
 try{
  const ok=await worker.fetch(req("/api/chat",{message:"드라이버?"}),env());
  assert.equal(ok.status,200);assert.match((await ok.json()).answer,/샤프트/);
  assert.equal(called,true);
  const bad=await worker.fetch(req("/api/chat",{message:"x".repeat(501)}),env());
  assert.equal(bad.status,400);
 }finally{globalThis.fetch=old}
});
function fakeDb(){
 const db=new Map();
 return {prepare(query){
  let args=[];return {
   bind(...values){args=values;return this},
   async first(){const row=db.get(args[0]);return row?{...row}:null},
   async run(){
    if(query.startsWith("INSERT")){
     db.set(args[0],{state_hash:args[1],created_at:args[2],used_at:null});return {meta:{changes:1}};
    }
    if(query.startsWith("UPDATE")){
     const row=db.get(args[1]);
     if(row&&row.used_at===null&&row.created_at>=args[2]){
      row.used_at=args[0];return {meta:{changes:1}};
     }
     return {meta:{changes:0}};
    }
    throw Error("unknown fake query");
   }
  }}
 };
}
test("phone identity requires consent, provider VERIFIED, same state, one-time use",async()=>{
 const old=globalThis.fetch;
 const e=env({DB:fakeDb()});
 try{
  const denied=await worker.fetch(req("/api/identity/start",{consent:false}),e);
  assert.equal(denied.status,400);
  const start=await worker.fetch(req("/api/identity/start",{consent:true}),e);
  assert.equal(start.status,200);
  const issued=await start.json();
  assert.match(issued.identityVerificationId,/^hyram[0-9a-f]{32}$/);
  assert.ok(issued.identityVerificationId.length<=40);
  const bad=await worker.fetch(req("/api/identity/confirm",{identityVerificationId:issued.identityVerificationId,state:"wrong"}),e);
  assert.equal(bad.status,403);
  globalThis.fetch=async(url)=>{
   assert.match(url,/api.portone.io/);
   return new Response(JSON.stringify({status:"VERIFIED",storeId:"store-test",verifiedCustomer:{name:"fixture only"}}),{status:200});
  };
  const confirmed=await worker.fetch(req("/api/identity/confirm",{identityVerificationId:issued.identityVerificationId,state:issued.state}),e);
  assert.equal(confirmed.status,200);
  const answer=await confirmed.json();
  assert.deepEqual(answer,{verified:true,scope:"phone-identity-only"});
  assert.equal(JSON.stringify(answer).includes("fixture"),false);
  const replay=await worker.fetch(req("/api/identity/confirm",{identityVerificationId:issued.identityVerificationId,state:issued.state}),e);
  assert.equal(replay.status,403);
 }finally{globalThis.fetch=old}
});
