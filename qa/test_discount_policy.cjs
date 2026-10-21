'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {quoteClubDiscount,CLUB_MEMBER_DISCOUNTS}=require('../pricing/discount-policy.cjs');

test('one discount only: same verified KRW base, standard beats lower membership rate',()=>{
 for(const [tier,rate] of Object.entries(CLUB_MEMBER_DISCOUNTS)){
  const r=quoteClubDiscount({verifiedBasePrice:1000000,standardEligible:true,membershipTier:tier,membershipEligible:true});
  assert.equal(r.status,'quote',tier);assert.equal(r.discountPercent,20,tier);assert.equal(r.payablePrice,800000,tier);assert.equal(r.discountSource,'STANDARD_20',tier);assert.equal(r.stacked,false,tier);
  assert.ok(rate<20);
 }
});
test('member discount applies only when standard is not eligible',()=>{
 for(const [tier,rate] of Object.entries(CLUB_MEMBER_DISCOUNTS)){
  const r=quoteClubDiscount({verifiedBasePrice:1000000,standardEligible:false,membershipTier:tier,membershipEligible:true});
  assert.equal(r.discountPercent,rate);assert.equal(r.payablePrice,1000000*(100-rate)/100);
  assert.equal(r.discountSource,'MEMBER');
 }
});
test('standard discount still applies to non-member and unverified membership',()=>{
 for(const tier of ['NONE','GOLD']){
  const r=quoteClubDiscount({verifiedBasePrice:1000000,standardEligible:true,membershipTier:tier,membershipEligible:false});
  assert.equal(r.payablePrice,800000);assert.equal(r.discountPercent,20);
 }
});
test('do not silently grant any discount without eligibility',()=>{
 const r=quoteClubDiscount({verifiedBasePrice:1000000,standardEligible:false,membershipTier:'GOLD',membershipEligible:false});
 assert.equal(r.discountPercent,0);assert.equal(r.payablePrice,1000000);assert.equal(r.discountSource,'NONE');
});
test('VIP requires approved negotiated rate; can beat standard but never stacks',()=>{
 const params={verifiedBasePrice:1000000,standardEligible:true,membershipTier:'VIP',membershipEligible:true};
 assert.equal(quoteClubDiscount(params).status,'needs_review');
 const better=quoteClubDiscount({...params,vipNegotiatedPercent:25});
 assert.equal(better.status,'quote');assert.equal(better.discountSource,'MEMBER');assert.equal(better.payablePrice,750000);assert.equal(better.discountPercent,25);assert.equal(better.stacked,false);
 const lower=quoteClubDiscount({...params,vipNegotiatedPercent:12});
 assert.equal(lower.payablePrice,800000);assert.equal(lower.discountSource,'STANDARD_20');
});
test('invalid/unverified prices and unknown membership fail closed',()=>{
 for(const price of [null,undefined,0,-100,123.45,NaN,Infinity,'1000000']){
  assert.equal(quoteClubDiscount({verifiedBasePrice:price,standardEligible:true}).status,'needs_review');
 }
 assert.equal(quoteClubDiscount({verifiedBasePrice:1000000,membershipTier:'PLATINUM'}).status,'needs_review');
 assert.equal(quoteClubDiscount({verifiedBasePrice:1000000,standardEligible:1}).status,'needs_review');
 assert.equal(quoteClubDiscount({verifiedBasePrice:1000000,vipNegotiatedPercent:15}).status,'needs_review');
 assert.equal(quoteClubDiscount({verifiedBasePrice:1000000,membershipTier:'VIP',membershipEligible:true,vipNegotiatedPercent:-1}).status,'needs_review');
});
test('round only after selecting single discount',()=>{
 const r=quoteClubDiscount({verifiedBasePrice:99999,standardEligible:false,membershipTier:'SILVER',membershipEligible:true});
 assert.equal(r.payablePrice,94999);assert.equal(r.discountPercent,5);
});
