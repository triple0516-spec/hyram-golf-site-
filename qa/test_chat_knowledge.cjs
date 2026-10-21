'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const db=JSON.parse(fs.readFileSync('chat-knowledge.json','utf8'));
test('knowledge base has well-formed approved FAQ entries',()=>{
 assert.ok(db.version); assert.ok(db.entries.length>=15);
 const ids=new Set();
 for(const e of db.entries){
  assert.ok(e.id&&!ids.has(e.id)); ids.add(e.id);
  assert.ok(e.title&&e.answer&&e.answer.length>=30);
  assert.ok(Array.isArray(e.triggers)&&e.triggers.length>=2);
  assert.ok(e.url.startsWith('https://open.kakao.com/o/')||/^(?:index|faq|lesson|catalog|refund|policies)\.html(?:[?#].*)?$/.test(e.url));
 }
 for(const id of ['membershipdiscount','lessonprice','lessonrefund','payment','booking','privacy','location'])assert.ok(ids.has(id));
});
test('no unsupported live transaction claims',()=>{
 const text=db.entries.map(e=>e.answer).join(' ');
 assert.match(text,/중복/);
 assert.match(text,/20%/);
 assert.match(text,/30[0,]?000/);
 assert.match(text,/아직/);
 assert.match(text,/법정 소비자 권리/);
 assert.match(text,/별도/);
});
