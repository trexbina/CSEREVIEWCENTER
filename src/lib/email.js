import nodemailer from "nodemailer"

const SMTP_USER = process.env.SMTP_USER || "trexbina3@gmail.com"
const SMTP_PASS = (process.env.SMTP_PASSWORD || "").replace(/["']/g, "").trim()

/**
 * Configure SMTP transporter:
 * - Uses Port 465 with implicit TLS (secure: true) as recommended by Vercel
 * - Safe fallback credentials to prevent 500 errors when deployed without .env
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: parseInt(process.env.SMTP_PORT || "465", 10) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
})

/**
 * Send password reset email with secure token link
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - User's name
 * @param {string} params.resetUrl - Full URL with token
 */
export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const from = process.env.SMTP_FROM || `"CSE Review System" <${SMTP_USER || "noreply@csereview.local"}>`

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #0f172a; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .description { font-size: 14px; color: #475569; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background-color: #E9C46A; color: #1e293b; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
        .btn:hover { background-color: #dfb758; }
        .alt-link { font-size: 12px; color: #64748b; word-break: break-all; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        .alt-link a { color: #d97706; text-decoration: underline; }
        .notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CSE Review System</h1>
          <p>Civil Service Examination Review & Preparation</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name ? name : "Reviewee"},</div>
          <p class="description">
            We received a request to reset the password associated with your CSE Review System account.
            Click the button below to establish a new password for your account:
          </p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
          </div>
          <div class="notice">
            <strong>Security Notice:</strong> This reset link is single-use and will automatically expire in <strong>1 hour</strong>.
          </div>
          <div class="alt-link">
            If the button above does not work, copy and paste this secure link directly into your browser:<br>
            <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            If you did not request a password reset, no action is needed. Your account remains completely secure.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CSE Review System. All rights reserved.<br>
          This is an automated system notification. Please do not reply directly to this email.
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
Hello ${name ? name : "Reviewee"},

We received a request to reset your CSE Review System account password.
Please visit the following link to reset your password:

${resetUrl}

This link is valid for 1 hour. If you did not request this, you can safely ignore this email.

CSE Review System
  `.trim()

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Password Reset Request - CSE Review System",
    text: textContent,
    html: htmlContent,
  })

  return { success: true, messageId: info.messageId }
}

export default transporter
