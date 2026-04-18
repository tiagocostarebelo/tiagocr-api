import dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import db from '../db.js';

dotenv.config();

const EXPIRY_DAYS = parseInt(process.env.TOKEN_EXPIRY_DAYS) || 14;

const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    acc[key] = rest.join('=');
    return acc;
}, {});

const { name, email, type, business, description, source } = args;

// VALIDATE //
const errors = [];

if (!name) errors.push('--name is required');
if (!email) errors.push('--email is required');
if (!type) errors.push('--type is required');
if (!type && !['brand', 'web', 'both'].includes(type)) errors.push('-- type must be brand, web, or both');

if (errors.length) {
    errors.forEach(e => console.error(`x ${e}`));
    console.error(`
            Usage: 
            nde scripts/generate-token.js \\
            --name="Test Client" \\
            --email="testclient@example.com" \\
            --type="brand|web|both" \\
            --business="Type of business here" \\
            --description="We offer services" \\
            --source="Instagram"
        `);
    process.exit(1);
};

// GENERATE TOKEN //

const token = randomBytes(16).toString('hex');
const now = Date.now();
const expiresAt = now + EXPIRY_DAYS * 24 * 60 * 60 * 1000;

const prefill = JSON.stringify({
    business: business || '',
    descriptions: description || '',
    source: source || '',
});

db.prepare(`
  INSERT INTO tokens (token, client_name, client_email, project_type, prefill, created_at, expires_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(token, name, email, type, prefill, now, expiresAt);

// ── Output ────────────────────────────────────────────────────────────────────

const expiryDate = new Date(expiresAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
});

console.log(`
✓ Token created for ${name} (${type})
✓ Expires: ${expiryDate}
→ ${process.env.BASE_URL}/brief/${token}
`);