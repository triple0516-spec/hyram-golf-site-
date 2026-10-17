import { supabaseUrl, publishableKey } from './site-config.mjs';

const valid = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)
  && /^sb_publishable_[a-zA-Z0-9_-]+$/.test(publishableKey);
export const configured = valid;
let shared;
export function getClient() {
  if (!configured) return Promise.reject(new Error('HYRAM_AUTH_UNCONFIGURED'));
  if (!shared) {
    shared = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm')
      .then(({createClient}) => createClient(supabaseUrl, publishableKey, {
        auth:{detectSessionInUrl:true,autoRefreshToken:true,persistSession:true,flowType:'implicit'}
      }));
  }
  return shared;
}
export async function assertOwner(client) {
  const {data, error} = await client.auth.getUser();
  if (error || !data?.user) return false;
  const result = await client.rpc('hyram_is_owner');
  return !result.error && result.data === true;
}
