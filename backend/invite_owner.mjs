#!/usr/bin/env node
'use strict';
// Invite exactly one owner. Requires the actual Supabase project and a working auth callback.
// No credentials in Git, no hardcoded password, no public browser role assignment.
const args = new Set(process.argv.slice(2));
const live = args.has('--execute');
const email = (process.env.HYRAM_ADMIN_EMAIL || '').trim();
const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const redirect = process.env.HYRAM_ADMIN_REDIRECT_URL || '';
const ready = process.env.HYRAM_AUTH_READY === 'confirmed';

function fail(message) { console.error('BLOCKED: ' + message); process.exitCode = 1; }
if (!live) {
  console.log('DRY RUN ONLY: no account was created or invited.');
  console.log('Required for execution: --execute and HYRAM_AUTH_READY=confirmed,');
  console.log('HYRAM_ADMIN_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HYRAM_ADMIN_REDIRECT_URL.');
  console.log('The HTTPS callback must be live and authenticate email ownership before access.');
} else if (!ready) {
  fail('Auth callback, email confirmation and role checks must be confirmed first.');
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail('A valid owner email is required.');
} else if (!/^https:\/\/[^\s/]+$/.test(url)) {
  fail('A valid HTTPS Supabase project URL is required.');
} else if (!key) {
  fail('Missing server-only Supabase service-role key.');
} else {
  (async () => {
    const target = new URL(redirect);
    if (target.protocol !== 'https:' || target.hostname !== 'hyramgolf.kr' ||
        (target.pathname !== '/auth/callback' && target.pathname !== '/auth/callback.html')) {
      throw Error('Admin callback must be the verified HTTPS hyramgolf.kr auth callback.');
    }
    const headers = {apikey:key, Authorization:'Bearer ' + key};
    const existing = await fetch(url+'/rest/v1/hyram_admin_members?select=user_id&limit=1', {headers});
    if (!existing.ok) throw Error('Cannot verify owner uniqueness; apply schema first.');
    const rows = await existing.json();
    if (!Array.isArray(rows) || rows.length > 0) throw Error('An owner already exists: manual review required.');
    const endpoint = url+'/auth/v1/invite?redirect_to='+encodeURIComponent(redirect);
    const invitation = await fetch(endpoint, {
      method:'POST', headers:{...headers,'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    if (!invitation.ok) throw Error('Admin invite refused; existing accounts require manual identity verification.');
    const invited = await invitation.json();
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(invited.id || '')) throw Error('No valid Auth user ID returned; review invite before granting a role.');
    const grant = await fetch(url+'/rest/v1/hyram_admin_members', {
      method:'POST',
      headers:{...headers,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({user_id:invited.id,role:'owner',owner_slot:1})
    });
    if (!grant.ok) throw Error('Invite may have been sent but owner role grant failed; reconcile manually.');
    console.log('PASS: owner invite requested and role assigned to invited Auth user.');
    console.log('Account is NOT ACTIVE until the recipient verifies the email and signs in.');
  })().catch(e => { fail(e.message); });
}
