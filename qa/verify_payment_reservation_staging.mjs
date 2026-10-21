// HYRAM GOLF controlled STAGING E2E. Real Toss test keys only; never production.
// mode=prepare creates a test booking and a test order. mode=verify checks payment
// authorization already completed through an actual Toss test payment window.
// No live merchant payments, customer bookings or real golf-course slots.
const env=process.env;
const mode=env.HYRAM_E2E_MODE;
function blocked(message){console.error('BLOCKED: '+message);process.exit(2)}
function check(condition,message){if(!condition){console.error('FAIL: '+message);process.exit(1)}}
if(!['prepare','verify'].includes(mode))blocked('Set HYRAM_E2E_MODE=prepare or verify');
const host=env.HYRAM_STAGING_API_ORIGIN,token=env.HYRAM_E2E_OPERATOR_TOKEN;
if(!host||!token)blocked('Staging API and test-only operator auth missing');
let base;try{base=new URL(host)}catch{blocked('Invalid staging URL')}
if(base.protocol!=='https:'||!/(staging|sandbox|test|dev)/i.test(base.hostname)||/^(www\\.)?hyramgolf\\.kr$/i.test(base.hostname)||base.pathname!=='/'||base.search||base.hash)blocked('Refusing to touch production/unknown host');
const headers={'authorization':'Bearer '+token,'content-type':'application/json','accept':'application/json','x-hyram-test-mode':'sandbox'};
async function request(path,method='GET',body){
 let response;try{response=await fetch(new URL(path,base),{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)})}catch(error){blocked('API cannot be reached: '+error.name)}
 let data={};try{data=await response.json()}catch{}
 return {status:response.status,data};
}
const health=await request('/api/health');
check(health.status===200&&health.data.environment==='staging'&&health.data.paymentMode==='test'&&health.data.bookingMode==='sandbox','Server did not prove staging + Toss test + sandbox booking configuration');
console.log('PASS staging server identity (does NOT imply payment or booking completion)');
if(mode==='prepare'){
 check(!!env.HYRAM_E2E_TEST_SKU,'Set a verified synthetic test SKU in the staging catalog');
 const bad=await request('/api/reservations','POST',{service:'레슨',customerName:'TEST',phone:'',privacyConsent:false,testOnly:true});
 check([400,422].includes(bad.status),'Invalid reservation must be rejected');
 const preferredDate=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
 const created=await request('/api/reservations','POST',{service:'레슨',customerName:'HYRAM AUTOMATED QA ONLY',preferredDate,preferredTime:'17:00',contactMethod:'카카오톡',phone:'01000000000',memo:'Synthetic test; never occupy a real instructor slot',privacyConsent:true,testOnly:true});
 check(created.status===201&&typeof created.data.id==='string'&&created.data.status==='received','Reservation persisted in received state');
 const rid=encodeURIComponent(created.data.id);
 const stored=await request('/api/reservations/'+rid);
 check(stored.status===200&&stored.data.id===created.data.id&&stored.data.status==='received'&&stored.data.testOnly===true,'Cannot read back persisted synthetic reservation');
 const confirmed=await request('/api/reservations/'+rid+'/confirm','POST',{testOnly:true});
 check(confirmed.status===200&&confirmed.data.status==='confirmed'&&confirmed.data.testOnly===true,'Server-side test reservation confirmation not recorded');
 const readback=await request('/api/reservations/'+rid);
 check(readback.status===200&&readback.data.status==='confirmed'&&readback.data.testOnly===true,'Confirmed reservation not persisted');
 console.log('PASS test-only DB reservation create/confirm/readback');
 const canceled=await request('/api/reservations/'+rid+'/cancel','POST',{testOnly:true});
 check(canceled.status===200&&canceled.data.status==='cancelled','Synthetic reservation cleanup not completed');
 console.log('PASS synthetic reservation cancellation');
 const order=await request('/api/orders','POST',{sku:env.HYRAM_E2E_TEST_SKU,quantity:1,membershipTier:'SILVER',testOnly:true});
 check(order.status===201&&typeof order.data.orderId==='string'&&Number.isSafeInteger(order.data.amount)&&order.data.amount>0&&order.data.paymentMode==='test','Staging test order must originate from verified server pricing');
 const changed=await request('/api/payments/confirm','POST',{orderId:order.data.orderId,amount:order.data.amount+1,paymentKey:'INVALID_TEST_KEY',testOnly:true});
 check([400,409,422].includes(changed.status),'Altered checkout amount was not rejected');
 console.log('PASS payment amount tampering blocked; real Toss test payment still NOT TESTED');
 console.log('PREPARED TEST ORDER ID: '+order.data.orderId);
 console.log('PREPARED TEST ORDER AMOUNT (KRW): '+order.data.amount);
 console.log('NEXT: complete a genuine Toss TEST checkout for this exact order; rerun with HYRAM_E2E_MODE=verify and HYRAM_E2E_ORDER_ID / HYRAM_E2E_AMOUNT / HYRAM_E2E_PAYMENT_KEY set as CI secrets');
}else{
 const orderId=env.HYRAM_E2E_ORDER_ID,key=env.HYRAM_E2E_PAYMENT_KEY,amount=Number(env.HYRAM_E2E_AMOUNT);
 if(!orderId||!key||!Number.isSafeInteger(amount)||amount<=0)blocked('Require authentic Toss test paymentKey, order ID, and server amount from previous prepare step');
 const original=await request('/api/orders/'+encodeURIComponent(orderId));
 check(original.status===200&&original.data.amount===amount&&original.data.paymentMode==='test','Persisted test order and amount mismatch');
 const confirmed=await request('/api/payments/confirm','POST',{orderId,paymentKey:key,amount,testOnly:true});
 check(confirmed.status===200&&confirmed.data.status==='DONE'&&confirmed.data.orderId===orderId&&confirmed.data.totalAmount===amount,'Toss test payment approval did not match order or amount');
 const stored=await request('/api/orders/'+encodeURIComponent(orderId));
 check(stored.status===200&&stored.data.paymentStatus==='DONE','Toss test approval not persisted');
 console.log('PASS actual Toss TEST approval and order DB readback');
 const repeated=await request('/api/payments/confirm','POST',{orderId,paymentKey:key,amount,testOnly:true});
 check(repeated.status===200&&repeated.data.orderId===orderId,'Duplicate approval must be idempotent');
 console.log('PASS idempotent confirmation retry');
 const cancelled=await request('/api/payments/'+encodeURIComponent(key)+'/cancel','POST',{cancelReason:'QA sandbox verification',testOnly:true});
 check(cancelled.status===200&&cancelled.data.status==='CANCELED','Toss test cancellation verification failed');
 const final=await request('/api/orders/'+encodeURIComponent(orderId));
 check(final.status===200&&final.data.paymentStatus==='CANCELED','Cancelled payment status not stored');
 console.log('PASS actual Toss TEST cancellation and order DB status');
}
