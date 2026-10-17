import {configured,getClient,assertOwner} from './client.mjs';
const status=document.querySelector('#auth-status');
function say(msg){status.textContent=msg}
if(!configured){say('관리자 인증 설정이 아직 연결되지 않았습니다.');}
else {
  try {
    const client=await getClient();
    const {data:session,error}=await client.auth.getSession();
    if(error)throw error;
    let existing=session?.session;
    if(!existing && new URLSearchParams(location.search).has('code')){
      const code=new URLSearchParams(location.search).get('code');
      const exchanged=await client.auth.exchangeCodeForSession(code);
      if(exchanged.error)throw exchanged.error;
      existing=exchanged.data?.session;
    }
    if(!existing)throw new Error('Missing verified session');
    history.replaceState(null,'',location.pathname);
    if(!(await assertOwner(client))){
      await client.auth.signOut();
      throw new Error('Not an approved owner');
    }
    say('관리자 인증이 확인됐습니다. 이동합니다.');
    location.replace('../admin/');
  }catch(e){
    history.replaceState(null,'',location.pathname);
    say('관리자 인증을 완료할 수 없습니다. 초대 링크의 유효기간과 관리자 권한을 확인해 주세요.');
  }
}
