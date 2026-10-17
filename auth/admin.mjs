import {configured,getClient,assertOwner} from '../auth/client.mjs';
const status=document.querySelector('#admin-status');
const shell=document.querySelector('#owner-only');
const emailNode=document.querySelector('#owner-identity');
const logout=document.querySelector('#logout');
function say(s){status.textContent=s}
if(!configured){say('관리자 인증 서버 연결 전입니다. 관리자 기능은 잠겨 있습니다.');}
else{
  try{
    const client=await getClient();
    if(!(await assertOwner(client)))throw new Error('Forbidden');
    const {data,error}=await client.auth.getUser();
    if(error||!data?.user)throw new Error('Session missing');
    emailNode.textContent=data.user.email||'확인된 소유자';
    shell.hidden=false;
    say('OWNER 권한이 확인되었습니다. 민감한 고객 기록과 결제 조작 기능은 별도 보안 검증 전까지 제공되지 않습니다.');
    logout.addEventListener('click',async()=>{logout.disabled=true;await client.auth.signOut();location.replace('../login.html');});
  }catch(e){shell.hidden=true;say('승인된 관리자 로그인 상태가 아닙니다.');}
}
