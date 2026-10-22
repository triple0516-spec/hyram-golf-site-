'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const t=p=>fs.readFileSync(p,'utf8');
const member=t('auth/member.mjs');
const client=t('auth/client.mjs');
const login=t('member-login.html');
const signup=t('signup.html');
const account=t('account.html');
const callback=t('auth/member-callback.html');
const index=t('index.html');
assert(member.includes('client.auth.signUp('),'Missing real Supabase signup API');
assert(member.includes('client.auth.signInWithPassword('),'Missing real Supabase sign-in API');
assert(member.includes('client.auth.getUser()'),'Account must verify user');
assert(member.includes('client.auth.signOut()'),'Missing sign-out');
assert(member.includes('emailRedirectTo:callback'),'Email confirmation redirect missing');
assert(signup.includes('id="member-consent"') && signup.includes('required'),'Policy consent required');
assert(signup.includes('autocomplete="new-password"'),'New password semantics missing');
assert(account.includes('id="member-private" hidden'),'Private area must fail closed');
assert(callback.includes('src="member.mjs"'),'Callback must process session');
assert(index.includes('href="member-login.html"') && index.includes('href="signup.html"'),'Customer navigation must target working forms');
assert(client.includes('assertOwner'),'Original owner protection must remain');
for (const [name,source] of Object.entries({member,login,signup,account,callback})){
  assert(!/service_role|sb_secret_|SUPABASE_SECRET_KEY|TOSS_SECRET/.test(source),name+' embeds secret');
  assert(!/\.innerHTML\s*=|eval\s*\(/.test(source),name+' uses unsafe DOM sink');
}
assert(t('auth/login.mjs').includes('shouldCreateUser:false'),'Existing owner OTP must not auto-create owner');
console.log('PASS: customer signup/signin/session/logout wiring and owner isolation static checks');
