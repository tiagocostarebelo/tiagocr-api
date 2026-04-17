import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASS,
    },
});

export const sendBriefEmail = async ({ clientName, projectType, answers }) => {
    const sections = formatAnswers(answers);

    await transporter.sendMail({
        from: `"TiagoCR" <${process.env.ZOHO_USER}>`,
        to: process.env.ZOHO_USER,
        subject: `New Brief - ${clientName} (${projectType})`,
        text: plainText({ clientName, projectType, sections }),
        html: htmlEmail({ clientName, projectType, sections }),
    });
};


const formatAnswers = (answers) => {
    return Object.entries(answers).map(([question, answer]) => ({
        question,
        answer: answer?.trim() || '-',
    }));
};

const plainText = ({ clientName, projectType, sections }) => {
    const lines = [
        `NEW BRIEF SUBMISSION`,
        `Client: ${clientName}`,
        `Project type: ${projectType}`,
        `Submitted: ${new Date().toLocaleString('en-GB')}`,
        ``,
        `─────────────────────────────────────────`,
        ``,
        ...sections.flatMap(({ question, answer }) => [question, answer, ``]),
    ];

    return lines.join('\n');
};

const htmlEmail = ({ clientName, projectType, sections }) => {
    const rows = sections.map(({ question, answer }) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;font-weight:600;
                 color:#1a1a1a;vertical-align:top;width:35%;font-family:Arial,sans-serif;
                 font-size:13px;">
        ${question}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;color:#444;
                 vertical-align:top;font-family:Arial,sans-serif;font-size:13px;
                 white-space:pre-wrap; ">
        ${answer}
      </td>
    </tr>
  `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:32px;background:#f5f5f5;font-family:Arial,sans-serif;">
      <table style="max-width:700px;margin:0 auto;background:#fff;
                    border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;">
            <span style="color:#C9A84C;font-size:11px;
                         letter-spacing:2px;text-transform:uppercase;">
              New Brief Submission
            </span>
            <h1 style="color:#fff;margin:8px 0 0;font-size:20px;">
              ${clientName}
            </h1>
            <span style="color:#888;font-size:13px;text-transform:capitalize;">
              ${projectType} project &nbsp;·&nbsp;
              ${new Date().toLocaleString('en-GB')}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <table style="width:100%;border-collapse:collapse;">
              ${rows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f5f5f5;
                     text-align:center;color:#888;font-size:11px;">
            TiagoCR · tiagocr.me
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};