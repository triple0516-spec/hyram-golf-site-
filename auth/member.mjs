import {configured,getClient} from './client.mjs';

const page=document.body.dataset.memberPage;
const status=document.querySelector('#member-status');
const form=document.querySelector('#member-form');
const fieldset=form?.querySelector('fieldset');
const submit=document.querySelector('#member-submit');
const callback=new URL('./member-callback.html',import.meta.url).href;
function say(message){if(status)status.textContent=message}
function reportError(err){
  const code=err?.code||'';
  if(code==='email_not_confirmed')return '이메일 인증이 필요합니다. 가입 메일함을 확인해 주세요.';
  if(code==='invalid_credentials')return '이메일 또는 비밀번호를 확인해 주세요.';
  if(code==='over_email_send_rate_limit'||code==='over_request_rate_limit')return '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  if(code==='signup_disabled'||code==='email_provider_disabled')return '현재 인증 서버에서 해당 가입 방식을 허용하지 않습니다. 관리자에게 문의해 주세요.';
  if(code==='weak_password')return '비밀번호 보안 기준을 충족하지 못했습니다. 더 안전한 비밀번호를 사용해 주세요.';
  return '인증 요청을 완료하지 못했습니다. 연결 상태와 이메일 인증 설정을 확인해 주세요.';
}

if(!configured){
  say('인증 서버가 설정되지 않았습니다. 현재 회원 기능을 사용할 수 없습니다.');
}else{
  try{
    const client=await getClient();
    if(page==='login'||page==='signup'){
      fieldset.disabled=false;
      say(page==='signup'?'이메일과 비밀번호로 가입할 수 있습니다. 이메일 확인이 필요할 수 있습니다.':'이메일과 비밀번호로 로그인하세요.');
      form.addEventListener('submit',async event=>{
        event.preventDefault();
        if(!form.reportValidity())return;
        const email=document.querySelector('#member-email').value.trim();
        const password=document.querySelector('#member-password').value;
        if(page==='signup'){
          const confirm=document.querySelector('#member-password-confirm').value;
          if(password!==confirm){say('비밀번호가 일치하지 않습니다.');return;}
          if(password.length<12){say('비밀번호는 12자 이상이어야 합니다.');return;}
          if(!document.querySelector('#member-consent').checked){say('약관과 개인정보처리방침에 동의해 주세요.');return;}
        }
        submit.disabled=true;
        say('인증 서버에 요청하고 있습니다.');
        try{
          if(page==='signup'){
            const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:callback}});
            if(error)throw error;
            document.querySelector('#member-password').value='';
            document.querySelector('#member-password-confirm').value='';
            if(data?.session){location.replace('account.html');return;}
            say('가입 요청을 접수했습니다. 인증 이메일이 도착했다면 메일의 확인 링크를 열어 주세요. 메일이 없다면 스팸함도 확인해 주세요.');
          }else{
            const {data,error}=await client.auth.signInWithPassword({email,password});
            if(error)throw error;
            if(!data?.session)throw new Error('Missing session');
            location.replace('account.html');
          }
        }catch(err){say(reportError(err));}
        finally{submit.disabled=false;}
      });
    }else if(page==='callback'){
      // Supabase JS client is configured to detect an OAuth/email session in the URL.
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      if(!data?.session)throw new Error('Missing session');
      const checked=await client.auth.getUser();
      if(checked.error||!checked.data?.user)throw new Error('Unverified user');
      history.replaceState(null,'',location.pathname);
      say('이메일 확인이 완료되었습니다. 내 계정으로 이동합니다.');
      location.replace('../account.html');
    }else if(page==='account'){
      const privateArea=document.querySelector('#member-private');
      const {data,error}=await client.auth.getUser();
      if(error||!data?.user){
        privateArea.hidden=true;
        say('로그인된 고객 계정이 없습니다. 고객 로그인 페이지에서 로그인해 주세요.');
      }else{
        document.querySelector('#member-identity').textContent=data.user.email||'인증된 회원';
        privateArea.hidden=false;
        say('회원 인증이 확인되었습니다.');
        const logout=document.querySelector('#member-logout');
        logout.addEventListener('click',async()=>{
          logout.disabled=true;
          try{const result=await client.auth.signOut();if(result.error)throw result.error;location.replace('member-login.html');}
          catch(e){say('로그아웃을 완료하지 못했습니다. 다시 시도해 주세요.');logout.disabled=false;}
        });
      }
    }
  }catch(err){
    if(page==='callback')history.replaceState(null,'',location.pathname);
    if(fieldset)fieldset.disabled=true;
    say(page==='callback'?'이메일 인증을 완료하지 못했습니다. 링크가 만료되었거나 인증 설정이 필요할 수 있습니다.':'인증 서비스에 연결할 수 없습니다. 고객센터에 문의해 주세요.');
  }
}