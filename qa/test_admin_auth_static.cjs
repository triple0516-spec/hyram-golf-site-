'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const f=path=>fs.readFileSync(path,'utf8');
const cfg=f('auth/site-config.mjs');
assert(cfg.includes("https://ekjbssnlurwriomgqlgw.supabase.co"),'Project URL must match provided project ref');
assert(/export const publishableKey = 'sb_publishable_[a-zA-Z0-9_-]+'/m.test(cfg),'Public key must use publishable prefix');
assert(!/sb_secret_|service_role|SUPABASE_SERVICE_ROLE_KEY\s*=/.test(cfg),'Service secrets may not appear in browser config');
assert(f('auth/client.mjs').includes("client.rpc('hyram_is_owner')"));
assert(f('auth/login.mjs').includes('shouldCreateUser:false'));
assert(!f('auth/login.mjs').includes('signUp('));
assert(f('admin/index.html').includes('id="owner-only" hidden'));
assert(f('auth/admin.mjs').includes('await assertOwner(client)'));
assert(f('auth/callback.mjs').includes('await assertOwner(client)'));
assert(f('backend/db/admin_roles.sql').includes('enable row level security'));
for(const name of ['auth/client.mjs','auth/login.mjs','auth/admin.mjs','auth/callback.mjs','admin/index.html','login.html']){
  assert(!f(name).includes('SUPABASE_SECRET_KEY'),name);
  assert(!f(name).includes('SERVICE_ROLE_KEY'),name);
}
console.log('PASS: public Supabase config, owner guards, and no embedded server secrets');
