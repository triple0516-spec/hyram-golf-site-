#!/usr/bin/env node
/**
 * Local-only deployment preparation. NEVER prints or writes an API secret.
 * Usage: node scripts/prepare-deployment.mjs <D1_DATABASE_UUID>
 * Run from backend/worker/.
 * Production config is intentionally ignored by git.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'wrangler.jsonc');
const output = path.join(root, 'wrangler.production.jsonc');
const d1Id = process.argv[2] ?? '';
const re = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
if (!re.test(d1Id)) {
 console.error('D1_DATABASE_UUID must be the actual UUID returned by Cloudflare D1 create. No file written.');
 process.exit(2);
}
if (fs.existsSync(output)) {
 console.error('A production config already exists. Review it manually before replacing it. No file written.');
 process.exit(3);
}
const config = JSON.parse(fs.readFileSync(input, 'utf8'));
if (config.d1_databases?.length !== 1 || config.d1_databases[0]?.binding !== 'DB') {
 console.error('Worker D1 binding is missing or unexpected. No file written.');
 process.exit(4);
}
const required = ['OPENAI_API_KEY'];
if (!required.every(x => config.secrets?.required?.includes(x))) {
 console.error('Required server secret declarations are missing. No file written.');
 process.exit(5);
}
config.d1_databases[0].database_id = d1Id.toLowerCase();
fs.writeFileSync(output, JSON.stringify(config, null, 2)+'\n', {flag:'wx',mode:0o600});
console.log('Production Wrangler config prepared locally: wrangler.production.jsonc');
console.log('It includes only a D1 resource ID; no API keys. Never commit secrets or .dev.vars.');
