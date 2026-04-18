// scripts/generate-token.js
import dotenv from 'dotenv';
dotenv.config();

const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    acc[key] = rest.join('=');
    return acc;
}, {});

const { name, email, type, business, description } = args;

const errors = [];
if (!name) errors.push('--name is required');
if (!email) errors.push('--email is required');
if (!type) errors.push('--type is required');
if (type && !['brand', 'web', 'both'].includes(type))
    errors.push('--type must be brand, web, or both');

if (errors.length) {
    errors.forEach(e => console.error(`✗ ${e}`));
    process.exit(1);
}

const res = await fetch(`${process.env.BASE_URL}/brief/admin/generate`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET,
    },
    body: JSON.stringify({ name, email, type, business, description }),
});

const data = await res.json();

if (!res.ok) {
    console.error('✗ Error:', data.error || data.errors);
    process.exit(1);
}

console.log(`
✓ Token created for ${data.client} (${data.type})
✓ Expires: ${data.expires}
→ ${data.url}
`);