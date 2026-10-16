import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const worker=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source=fs.readFileSync(path.join(worker,'wrangler.jsonc'),'utf8');
const script=fs.readFileSync(path.join(worker,'scripts/prepare-deployment.mjs'),'utf8');
test('production configuration prep is fail-closed and never copies secrets',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'hyram-dryrun-'));
 const work=path.join(root,'worker');
 fs.mkdirSync(path.join(work,'scripts'),{recursive:true});
 fs.writeFileSync(path.join(work,'scripts/prepare-deployment.mjs'),script);
 fs.writeFileSync(path.join(work,'wrangler.jsonc'),source);
 const execute=(id)=>spawnSync(process.execPath,[path.join(work,'scripts/prepare-deployment.mjs'),id],{cwd:work,encoding:'utf8'});
 const output=path.join(work,'wrangler.production.jsonc');
 try{
  const invalid=execute('REPLACE_DATABASE_ID');
  assert.equal(invalid.status,2);
  assert.equal(fs.existsSync(output),false);
  const valid=execute('12345678-1234-1234-1234-123456789abc');
  assert.equal(valid.status,0,valid.stderr);
  const c=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(c.d1_databases[0].database_id,'12345678-1234-1234-1234-123456789abc');
  assert.ok(c.secrets.required.includes('OPENAI_API_KEY'));
  assert.equal('api_key' in c,false);
  const overwrite=execute('12345678-1234-1234-1234-123456789abc');
  assert.equal(overwrite.status,3);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
