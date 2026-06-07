#!/usr/bin/env node

const DEFAULT_API_BASE = 'https://project-report-web.vercel.app';

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const apiBase = getArg('api-base') || process.env.API_BASE || DEFAULT_API_BASE;
const idToken = getArg('id-token') || process.env.GOOGLE_ID_TOKEN;
const code = getArg('code') || process.env.GOOGLE_AUTH_CODE;
const redirectUri = getArg('redirect-uri') || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8081/';

async function main() {
  if (!idToken && !code) {
    console.error('Missing credentials. Provide GOOGLE_ID_TOKEN or GOOGLE_AUTH_CODE.');
    console.error('Examples:');
    console.error('  GOOGLE_ID_TOKEN="<token>" npm run smoke:auth');
    console.error('  GOOGLE_AUTH_CODE="<code>" GOOGLE_REDIRECT_URI="http://localhost:8081/" npm run smoke:auth');
    process.exit(1);
  }

  const body = idToken
    ? { id_token: idToken }
    : { code, redirect_uri: redirectUri };

  const endpoint = `${apiBase.replace(/\/$/, '')}/api/auth/exchange`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok || !payload.token) {
    console.error(`Auth exchange failed: HTTP ${response.status}`);
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  console.log('Auth exchange passed.');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Mode: ${idToken ? 'id_token' : 'authorization_code'}`);
  console.log(`Expires in: ${payload.expiresIn || 'unknown'} seconds`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
