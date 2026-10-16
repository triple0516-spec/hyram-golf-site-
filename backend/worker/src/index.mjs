/* HYRAM Workers API; secrets stay server-side; production remains disabled until configured. */
const ALLOWED=new Set(["https://hyramgolf.kr","https://www.hyramgolf.kr"]);
const j=(data,status=200,origin="")=>new Response(JSON.stringify(data),{status,headers:{
 "content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin",
 "x-content-type-options":"nosniff",...(origin?{"access-control-allow-origin":origin}:{})}});
const verifyReady=e=>!!(e.DB&&e.RATE_LIMIT&&e.PORTONE_STORE_ID&&e.PORTONE_CHANNEL_KEY&&e.PORTONE_API_SECRET);
const chatReady=e=>!!(e.RATE_LIMIT&&e.OPENAI_API_KEY);
async function body(req){
 if(!(req.headers.get("content-type")||"").includes("application/json"))throw Error("TYPE");
 const raw=await req.text();if(raw.length>6000)throw Error("SIZE");return JSON.parse(raw);
}
async function limit(req,e,route){
 if(!e.RATE_LIMIT)return false;
 const result=await e.RATE_LIMIT.limit({key:route+":"+(req.headers.get("CF-Connecting-IP")||"unknown")});
 return result.success===true;
}
async function digest(t){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));
 return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function chat(req,e,origin){
 if(!chatReady(e))return j({error:"AI_NOT_CONFIGURED"},503,origin);
 if(!await limit(req,e,"chat"))return j({error:"RATE_LIMIT"},429,origin);
 let data;try{data=await body(req)}catch{return j({error:"INVALID_BODY"},400,origin)}
 const message=typeof data.message==="string"?data.message.trim():"";
 if(!message||message.length>500)return j({error:"INVALID_MESSAGE"},400,origin);
 const history=Array.isArray(data.history)?data.history:[];
 if(history.length>8||history.some(x=>!x||!["user","assistant"].includes(x.role)||typeof x.content!=="string"||x.content.length>500))
 return j({error:"INVALID_HISTORY"},400,origin);
 const instructions=[
 "You are the Korean HYRAM GOLF consultation assistant.",
 "Help with clubs, fitting, lessons, booking inquiries, and used clubs.",
 "Never invent inventory, prices, tee times, memberships, certifications, promotions, warranties or confirmed reservations.",
 "You cannot charge cards, accept bookings or access customer records.",
 "Direct customers to HYRAM staff for quotes, scheduling and final decisions.",
 "Never request national identification numbers, credit card numbers, passwords, precise addresses or sensitive personal data.",
 "Respond briefly and warmly in Korean; clarify limitations of AI recommendations."
 ].join(" ");
 let up;
 try{up=await fetch("https://api.openai.com/v1/responses",{
 method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+e.OPENAI_API_KEY},
 body:JSON.stringify({model:e.OPENAI_MODEL||"gpt-5-mini",store:false,instructions,
 input:history.map(x=>({role:x.role,content:x.content})).concat([{role:"user",content:message}]),max_output_tokens:500}),
 signal:AbortSignal.timeout(18000)})}catch{return j({error:"UPSTREAM_TIMEOUT"},502,origin)}
 if(!up.ok)return j({error:"UPSTREAM_FAILED"},502,origin);
 let result;try{result=await up.json()}catch{return j({error:"INVALID_UPSTREAM"},502,origin)}
 const answer=(result.output||[]).filter(x=>x.type==="message").flatMap(x=>x.content||[])
 .filter(x=>x.type==="output_text"&&typeof x.text==="string").map(x=>x.text).join("\n").slice(0,2200);
 return answer?j({answer},200,origin):j({error:"EMPTY_ANSWER"},502,origin);
}
async function start(req,e,origin){
 if(!verifyReady(e))return j({error:"IDENTITY_NOT_CONFIGURED"},503,origin);
 if(!await limit(req,e,"identity"))return j({error:"RATE_LIMIT"},429,origin);
 let data;try{data=await body(req)}catch{return j({error:"INVALID_BODY"},400,origin)}
 if(data.consent!==true)return j({error:"CONSENT_REQUIRED"},400,origin);
 const id="hyram"+crypto.randomUUID().replace(/-/g,""),state=crypto.randomUUID()+crypto.randomUUID();
 const ts=Math.floor(Date.now()/1000);
 try{await e.DB.prepare("INSERT INTO verification_attempts (id,state_hash,created_at,used_at) VALUES (?1,?2,?3,NULL)")
 .bind(id,await digest(state),ts).run()}catch{return j({error:"DATABASE_UNAVAILABLE"},503,origin)}
 return j({identityVerificationId:id,state,storeId:e.PORTONE_STORE_ID,channelKey:e.PORTONE_CHANNEL_KEY,
 redirectUrl:origin+"/verify.html"},200,origin);
}
async function confirm(req,e,origin){
 if(!verifyReady(e))return j({error:"IDENTITY_NOT_CONFIGURED"},503,origin);
 if(!await limit(req,e,"identity"))return j({error:"RATE_LIMIT"},429,origin);
 let data;try{data=await body(req)}catch{return j({error:"INVALID_BODY"},400,origin)}
 const id=data.identityVerificationId,state=data.state;
 if(typeof id!=="string"||!/^hyram[0-9a-f]{32}$/.test(id)||
 typeof state!=="string"||state.length>140)return j({error:"INVALID_ATTEMPT"},400,origin);
 const now=Math.floor(Date.now()/1000);
 let row;try{row=await e.DB.prepare("SELECT state_hash,created_at,used_at FROM verification_attempts WHERE id=?1").bind(id).first()}
 catch{return j({error:"DATABASE_UNAVAILABLE"},503,origin)}
 if(!row||row.used_at!==null||row.created_at<now-600||row.state_hash!==await digest(state))
 return j({verified:false,error:"INVALID_OR_EXPIRED"},403,origin);
 let p;try{p=await fetch("https://api.portone.io/identity-verifications/"+encodeURIComponent(id),{
 headers:{"authorization":"PortOne "+e.PORTONE_API_SECRET,"accept":"application/json"},
 signal:AbortSignal.timeout(12000)})}catch{return j({error:"PROVIDER_UNAVAILABLE"},502,origin)}
 if(!p.ok)return j({error:"PROVIDER_UNAVAILABLE"},502,origin);
 let result;try{result=await p.json()}catch{return j({error:"INVALID_PROVIDER_RESPONSE"},502,origin)}
 if(result.status!=="VERIFIED"||!result.verifiedCustomer||
 (result.storeId&&result.storeId!==e.PORTONE_STORE_ID))
 return j({verified:false,error:"NOT_VERIFIED"},403,origin);
 // Conditional update ensures that the attempt cannot be confirmed twice.
 let updated;try{updated=await e.DB.prepare("UPDATE verification_attempts SET used_at=?1 WHERE id=?2 AND used_at IS NULL AND created_at>=?3")
 .bind(now,id,now-600).run()}catch{return j({error:"DATABASE_UNAVAILABLE"},503,origin)}
 if(!updated?.meta?.changes)return j({verified:false,error:"ALREADY_USED"},409,origin);
 // Only confirm the phone check, never claim a member account has been created.
 return j({verified:true,scope:"phone-identity-only"},200,origin);
}
export default {async fetch(req,e){
 const originValue=req.headers.get("Origin")||"",origin=ALLOWED.has(originValue)?originValue:"";
 const pathname=new URL(req.url).pathname;
 if(req.method==="GET"&&pathname==="/health")
  return j({status:"ok",chatReady:chatReady(e),identityReady:verifyReady(e)},200,origin);
 if(!origin)return j({error:"FORBIDDEN_ORIGIN"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{
 "access-control-allow-origin":origin,"access-control-allow-methods":"GET,POST,OPTIONS",
 "access-control-allow-headers":"content-type","access-control-max-age":"600","vary":"Origin"}});
 if(req.method==="GET"&&pathname==="/api/identity/config")return j({enabled:verifyReady(e)},200,origin);
 if(req.method==="POST"&&pathname==="/api/chat")return chat(req,e,origin);
 if(req.method==="POST"&&pathname==="/api/identity/start")return start(req,e,origin);
 if(req.method==="POST"&&pathname==="/api/identity/confirm")return confirm(req,e,origin);
 return j({error:"NOT_FOUND"},404,origin);
}};
