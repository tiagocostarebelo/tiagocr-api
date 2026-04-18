import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { readFileSync } from 'fs';
import { sendBriefEmail } from '../mailer.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// HELPERS //

const getToken = (token) => db.prepare(`
  SELECT * FROM tokens WHERE token = ?
`).get(token);

const isExpired = (record) => Date.now() > record.expires_at;

const deadEnd = (res, message) => res.status(410).send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TiagoCR — Brief</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1a1a1a;
        font-family: Arial, sans-serif;
      }
      .box {
        text-align: center;
        padding: 48px;
      }
      .label {
        color: #C9A84C;
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      p {
        color: #888;
        font-size: 14px;
        margin: 12px 0 0;
      }
      a {
        color: #C9A84C;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="label">TiagoCR</div>
      <p>${message}</p>
      <p><a href="https://tiagocr.me">tiagocr.me</a></p>
    </div>
  </body>
  </html>
`);

// GET //

router.get('/:token', (req, res) => {
    const record = getToken(req.params.token);

    if (!record) return deadEnd(res, 'This link is not valid.');
    if (record.used) return deadEnd(res, 'This brief has already been submitted. Thank you.');
    if (isExpired(record)) return deadEnd(res, 'This link has expired. Please get in touch to request a new one.');

    const prefill = JSON.parse(record.prefill || '{}');

    // Inject token data into the HTML before serving
    const html = `
    <script>
      window.__BRIEF__ = {
        token:       "${req.params.token}",
        clientName:  "${record.client_name}",
        projectType: "${record.project_type}",
        prefill: {
          business:    ${JSON.stringify(prefill.business || '')},
          description: ${JSON.stringify(prefill.description || '')},
          source:      ${JSON.stringify(prefill.source || '')},
        }
      };
    </script>
  `;

    // Read the HTML file and inject the script before </head>
    const filePath = path.join(__dirname, '..', 'public', 'brief.html');
    const template = readFileSync(filePath, 'utf-8');
    const page = template.replace('</head>', `${html}\n</head>`);
    res.send(page);
});

// POST //

router.post('/:token/submit', async (req, res) => {
    const record = getToken(req.params.token);

    // Validate token again — guard against race conditions
    if (!record) return res.status(410).json({ error: 'Link not valid.' });
    if (record.used) return res.status(410).json({ error: 'Already submitted.' });
    if (isExpired(record)) return res.status(410).json({ error: 'Link expired.' });

    const now = Date.now();
    const answers = req.body;

    try {
        // Save submission
        db.prepare(`
      INSERT INTO submissions (token_id, answers, submitted_at)
      VALUES (?, ?, ?)
    `).run(record.id, JSON.stringify(answers), now);

        // Mark token as used
        db.prepare(`
      UPDATE tokens SET used = 1, submitted_at = ? WHERE id = ?
    `).run(now, record.id);

        // Send email
        await sendBriefEmail({
            clientName: record.client_name,
            projectType: record.project_type,
            answers,
        });

        res.json({ success: true });

    } catch (err) {
        console.error('Submission error:', err);
        res.status(500).json({ error: 'Submission failed. Please try again.' });
    }
});

export default router;