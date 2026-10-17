// Public-only reachability probe. Never request or print private user, session or admin data.
import {supabaseUrl,publishableKey} from '../auth/site-config.mjs';
const timeout = ms=>AbortSignal.timeout(ms);
let good=false;
try{
  const response=await fetch(supabaseUrl+'/auth/v1/settings',{
    headers:{apikey:publishableKey},signal:timeout(18000)
  });
  console.log('Supabase Auth settings endpoint HTTP '+response.status);
  good=response.ok;
  if(response.ok){
    const j=await response.json().catch(()=>({}));
    const email=typeof j?.external?.email==='boolean' ? (j.external.email?'ON':'OFF') : 'NOT_EXPOSED';
    console.log('Email provider (public settings): '+email);
    console.log('RESULT: Supabase public Auth project reachable; owner account presence is NOT verified.');
  }
}catch(e){
  console.log('Supabase Auth public endpoint: connection unavailable ('+(e?.name||'network error')+')');
}
try{
  const response=await fetch(supabaseUrl+'/rest/v1/rpc/hyram_is_owner',{
    method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json'},
    body:'{}',signal:timeout(15000)
  });
  const j=await response.json().catch(()=>null);
  const code=(typeof j?.code==='string' ? j.code : 'none');
  console.log('Anonymous OWNER RPC probe HTTP '+response.status+' / result-code '+code);
  if(response.ok&&j===true){
    console.log('SECURITY FAIL: unauthenticated request claimed owner access');
    process.exitCode=1;
  }else if(response.ok&&j===false){
    console.log('PASS: RPC exists and anonymous request is not OWNER');
  }else{
    console.log('CHECK NEEDED: OWNER RPC may not be provisioned, or anonymous RPC access is blocked.');
  }
}catch(e){
  console.log('OWNER RPC endpoint: reachability unavailable ('+(e?.name||'network error')+')');
}
if(!good)console.log('BLOCKED: Cannot confirm live Supabase Auth from public endpoint.');
console.log('This probe cannot enumerate Auth users, grant admin roles or send email invitations.');
