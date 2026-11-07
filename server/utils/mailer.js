import nodemailer from 'nodemailer'

/**
 * Create a reusable transporter.
 *
 * Reads from env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * For Gmail:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=your-email@gmail.com
 *   SMTP_PASS=your-app-password        (use a Google App Password, NOT your login password)
 *   SMTP_FROM="Padmashali Matrimony <your-email@gmail.com>"
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,                        // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send a 6-digit OTP to the given email address.
 */
export async function sendOTPEmail(toEmail, otp) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Your Verification Code — Padmashali Samaj Matrimony',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#b8860b;margin:0 0 12px;">Padmashali Samaj Matrimony</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;color:#333;margin:20px 0;">
          ${otp}
        </p>
        <p style="font-size:13px;color:#888;">This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="font-size:12px;color:#aaa;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  })
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

export async function sendContactReplyEmail(toEmail, recipientName, reply, originalSubject) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  const subject = String(originalSubject || 'Your message to Padmashali Matrimony')
    .replace(/[\r\n]+/g, ' ')
    .trim()

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `Re: ${subject}`,
    text: `Hello ${recipientName},\n\n${reply}\n\nPadmashali Matrimony Admin Team`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <p>Hello ${escapeHtml(recipientName)},</p>
        <p style="white-space:pre-wrap;">${escapeHtml(reply)}</p>
        <p>Padmashali Matrimony Admin Team</p>
      </div>
    `,
  })
}
