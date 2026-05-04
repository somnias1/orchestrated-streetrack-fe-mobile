const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse .env file from project root
const env = {};
const envPath = path.join(process.cwd(), '.env');
try {
  const raw = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
} catch {
  // .env not found — fall back to process.env
}

const get = (key) => env[key] || process.env[key] || '';

const runId = Date.now();
const email = get('E2E_USER_EMAIL');
const password = get('E2E_USER_PASSWORD');

if (!email || !password) {
  console.error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env');
  process.exit(1);
}

execSync(
  `maestro test .maestro/flows/ --env RUN_ID=${runId} --env E2E_USER_EMAIL=${email} --env E2E_USER_PASSWORD=${password}`,
  { stdio: 'inherit' },
);
