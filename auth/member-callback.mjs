import {getMemberClient} from './member-client.mjs';
const status=document.querySelector('#auth-status');
const params=new URLSearchParams(location.search);
const code=params.get('code');
const rejected=params.has('error')||params.has('error_description');
history.replaceState(null,'',location.pathname);
try{
  if(rejected||!code)throw new Error('NO_AUTHORIZATION_CODE');
  const client=await getMemberClient();
  const {error}=await client.auth.exchangeCodeForSession(code);
  if(error)throw error;
  const result=await client.auth.getUser();
  if(result.error||!result.data?.user)throw new Error('UNVERIFIED_USER');
  status.textContent='회원 인증이 완료되었습니다.';
  location.replace('../login.html');
}catch{status.textContent='로그인을 완료하지 못했습니다. 취소되었거나 인증 시간이 지났을 수 있습니다. 로그인 화면에서 다시 시도해 주세요.';}
