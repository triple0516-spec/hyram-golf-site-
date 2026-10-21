import {supabaseUrl,publishableKey} from './site-config.mjs';
import {configured} from './client.mjs';
let shared;
export function getMemberClient(){
  if(!configured)return Promise.reject(new Error('AUTH_UNCONFIGURED'));
  if(!shared)shared=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm')
    .then(({createClient})=>createClient(supabaseUrl,publishableKey,{auth:{
      storageKey:'hyram-member-auth',flowType:'pkce',detectSessionInUrl:false,
      persistSession:true,autoRefreshToken:true
    }}));
  return shared;
}
