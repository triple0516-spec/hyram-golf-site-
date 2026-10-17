import {configured,getClient,assertOwner} from './client.mjs';
const status=document.querySelector('#auth-status');
const form=document.querySelector('#owner-login');
const email=document.querySelector('#owner-email');
const submit=document.querySelector('#owner-submit');
const callback=new URL('auth/callback.html',new URL('../',import.meta.url)).href;
function say(message){status.textContent=message}
if(!configured){
  say('관리자 인증 서버 연결 준비 중입니다. 아직 이메일 로그인은 활성화되지 않았습니다.');
}else{
  form.querySelector('fieldset').disabled=false;
  say('관리자 이메일로 1회용 로그인 링크를 보낼 수 있습니다.');
  try{
    const client=await getClient();
    if(await assertOwner(client)){location.replace('admin/');}
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const address=email.value.trim();
      if(!email.checkValidity())return email.reportValidity();
      submit.disabled=true;
      say('인증 이메일 발송을 요청하고 있습니다.');
      try{
        const {error}=await client.auth.signInWithOtp({
          email:address,options:{shouldCreateUser:false,emailRedirectTo:callback}
        });
        if(error)throw error;
        say('등록된 관리자 계정이라면 이메일로 로그인 링크가 발송됩니다. 메일함을 확인해 주세요.');
        email.value='';
      }catch(err){
        say('인증 메일을 발송하지 못했습니다. 관리자 계정 초대 및 Supabase 이메일 설정을 확인해 주세요.');
      }finally{submit.disabled=false;}
    });
  }catch(e){
    form.querySelector('fieldset').disabled=true;
    say('인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
