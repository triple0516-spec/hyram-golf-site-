(function(){
"use strict";
const status=document.getElementById("verifyStatus"),button=document.getElementById("verifyStart"),agree=document.getElementById("verifyConsent");
const base=window.HYRAM_API_BASE||"";
const storageKey="hyram-pending-identity";
function message(text){status.textContent=text;}
async function request(path,opts){
 const response=await fetch(new URL(path,base),{...opts,headers:{"Content-Type":"application/json"}});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"서버 처리에 실패했어요.");
 return data;
}
async function confirmRedirect(){
 const args=new URLSearchParams(location.search);
 if(!args.has("identityVerificationId")&&!args.has("code"))return;
 history.replaceState(null,"",location.pathname);
 if(args.get("code")){sessionStorage.removeItem(storageKey);message("인증이 완료되지 않았어요. 다시 시도해 주세요.");return;}
 const pending=JSON.parse(sessionStorage.getItem(storageKey)||"null");
 sessionStorage.removeItem(storageKey);
 if(!pending||pending.id!==args.get("identityVerificationId")){message("인증 요청 정보를 확인할 수 없어요. 다시 진행해 주세요.");return;}
 try{
  const result=await request("/api/identity/confirm",{method:"POST",body:JSON.stringify({
   identityVerificationId:pending.id,state:pending.state})});
  message(result.verified?"휴대폰 본인확인이 완료됐습니다. 계정 가입 기능은 아직 준비 중입니다.":"인증을 확인하지 못했어요.");
 }catch{message("서버에서 본인확인을 확인하지 못했어요. 다시 시도해 주세요.")}
}
async function init(){
 if(!base){message("본인확인 서버 연결 준비 중입니다. 아직 실제 인증을 시작할 수 없어요.");return;}
 try{
  const c=await request("/api/identity/config",{method:"GET"});
  if(!c.enabled){message("인증기관 계약·서버 설정이 완료되지 않았습니다.");return;}
  button.disabled=false;button.textContent="휴대폰 본인확인 시작";
  message("인증기관에 연결할 준비가 됐어요. 동의한 후 본인확인을 진행하세요.");
  await confirmRedirect();
 }catch{message("본인확인 서버 연결을 확인하지 못했어요.");}
}
button.addEventListener("click",async function(){
 if(!agree.checked){message("본인확인 개인정보 처리 안내에 먼저 동의해 주세요.");return;}
 if(!window.PortOne?.requestIdentityVerification){message("인증기관 화면을 불러오지 못했어요.");return;}
 button.disabled=true;message("인증 요청을 준비하고 있어요…");
 try{
  const issued=await request("/api/identity/start",{method:"POST",body:JSON.stringify({consent:true})});
  sessionStorage.setItem(storageKey,JSON.stringify({id:issued.identityVerificationId,state:issued.state}));
  const result=await window.PortOne.requestIdentityVerification({
   storeId:issued.storeId,channelKey:issued.channelKey,
   identityVerificationId:issued.identityVerificationId,redirectUrl:issued.redirectUrl});
  if(result?.code){message(result.message||"인증이 취소됐습니다.");sessionStorage.removeItem(storageKey);return;}
  const confirmed=await request("/api/identity/confirm",{method:"POST",body:JSON.stringify({
   identityVerificationId:issued.identityVerificationId,state:issued.state})});
  sessionStorage.removeItem(storageKey);
  message(confirmed.verified?"휴대폰 본인확인이 완료됐습니다. 계정 생성은 아직 준비 중입니다.":"인증이 완료되지 않았어요.");
 }catch{message("인증을 완료하지 못했습니다. 담당자에게 문의하거나 나중에 다시 시도해 주세요.");}
 finally{button.disabled=false;}
});
init();
})();
