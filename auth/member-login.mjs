import {socialProviders} from './social-config.mjs';
import {getMemberClient} from './member-client.mjs';
const status=document.querySelector('#auth-status');
const actions=document.querySelector('#social-actions');
const session=document.querySelector('#member-session');
const buttons=[...document.querySelectorAll('[data-provider]')];
const callback=new URL('member-callback.html',import.meta.url).href;
const say=text=>{status.textContent=text;};
say('이용할 로그인 서비스를 선택해 주세요. 연결 준비 중인 서비스는 안내가 표시됩니다.');
for(const button of buttons){
  const provider=socialProviders[button.dataset.provider];
  const note=document.createElement('p');note.className='provider-note';
  note.id='provider-'+button.dataset.provider;
  note.textContent=provider.enabled?'로그인 연결 가능':'연결 준비 중 · 아직 로그인할 수 없습니다.';
  button.setAttribute('aria-describedby',note.id);button.after(note);
  button.addEventListener('click',async()=>{
    if(!provider.enabled){say(provider.label+' 로그인 연결을 준비하고 있습니다. 지금은 로그인 없이 상담을 이용해 주세요.');return;}
    buttons.forEach(b=>b.disabled=true);
    say(provider.label+' 인증 화면으로 이동합니다.');
    try{
      const client=await getMemberClient();
      const {data,error}=await client.auth.signInWithOAuth({provider:provider.id,options:{redirectTo:callback,skipBrowserRedirect:true}});
      if(error||!data?.url)throw new Error('OAUTH_START_FAILED');
      const target=new URL(data.url);
      const {supabaseUrl}=await import('./site-config.mjs');
      if(target.origin!==new URL(supabaseUrl).origin||target.pathname!=='/auth/v1/authorize')throw new Error('INVALID_AUTH_DESTINATION');
      location.assign(target.href);
    }catch{say('로그인 연결에 실패했습니다. 잠시 후 다시 시도하거나 상담으로 문의해 주세요.');buttons.forEach(b=>b.disabled=false);}
  });
}
try{
  const client=await getMemberClient();
  const {data,error}=await client.auth.getUser();
  if(!error&&data?.user){actions.hidden=true;session.hidden=false;say('로그인되었습니다.');}
  document.querySelector('#member-logout').addEventListener('click',async e=>{
    e.currentTarget.disabled=true;
    const {error}=await client.auth.signOut();
    if(error){say('로그아웃하지 못했습니다. 다시 시도해 주세요.');e.currentTarget.disabled=false;return;}
    location.replace('login.html');
  });
}catch{say('인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');}
