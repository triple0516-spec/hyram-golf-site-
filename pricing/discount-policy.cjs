'use strict';
// HYRAM GOLF draft quotation rule A. Manual/verified product references only.
// This module does not execute payments, create orders, or fetch market prices.
const CLUB_MEMBER_DISCOUNTS=Object.freeze({SILVER:5,GOLD:10,PREMIUM:15});
function quoteClubDiscount({verifiedBasePrice,standardEligible=false,membershipTier='NONE',membershipEligible=false,vipNegotiatedPercent=null}={}){
  if(!Number.isSafeInteger(verifiedBasePrice)||verifiedBasePrice<=0) return {status:'needs_review',reason:'A positive, verified KRW reference price is required.'};
  if(typeof standardEligible!=='boolean'||typeof membershipEligible!=='boolean') return {status:'needs_review',reason:'Discount eligibility must be confirmed.'};
  if(typeof membershipTier!=='string'||!['NONE','SILVER','GOLD','PREMIUM','VIP'].includes(membershipTier)) return {status:'needs_review',reason:'Unknown membership tier.'};
  if(membershipTier==='VIP'&&membershipEligible){
    if(vipNegotiatedPercent===null) return {status:'needs_review',reason:'VIP discount must be individually negotiated and approved before quoting.'};
    if(!Number.isFinite(vipNegotiatedPercent)||vipNegotiatedPercent<0||vipNegotiatedPercent>100) return {status:'needs_review',reason:'VIP rate needs approval.'};
  }else if(vipNegotiatedPercent!==null){
    return {status:'needs_review',reason:'VIP negotiated rate is only valid for an eligible VIP member.'};
  }
  const standard=standardEligible?20:0;
  const member=membershipEligible?(membershipTier==='VIP'?vipNegotiatedPercent:(CLUB_MEMBER_DISCOUNTS[membershipTier]||0)):0;
  const percent=Math.max(standard,member);
  const source=percent===0?'NONE':standard>=member&&standardEligible?'STANDARD_20':'MEMBER';
  const payablePrice=Math.round(verifiedBasePrice*(100-percent)/100);
  return {status:'quote',referencePrice:verifiedBasePrice,discountPercent:percent,discountSource:source,payablePrice,stacked:false,manualApprovalRequired:true};
}
module.exports={quoteClubDiscount,CLUB_MEMBER_DISCOUNTS};
