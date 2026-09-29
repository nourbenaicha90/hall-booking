import nodemailer from 'nodemailer';
import { query } from '../db/pool.js';

let transporter = null;
if (process.env.SMTP_HOST) {
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function sendMail(to, subject, html) {
  if (!transporter) {
    console.log(`[mail:dev] إلى=${to} | ${subject}\n${html.replace(/<[^>]+>/g, ' ').trim()}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, html });
  } catch (e) {
    console.error('فشل إرسال البريد:', e.message);
  }
}

// إشعار داخلي + بريد إلكتروني
export async function notify(userId, title, message) {
  if (!userId) return;
  await query('INSERT INTO notifications(user_id,title,message) VALUES($1,$2,$3)', [userId, title, message]);
  const { rows } = await query('SELECT email FROM users WHERE id=$1', [userId]);
  if (rows[0]) {
    sendMail(
      rows[0].email,
      title,
      `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8"><h2>${esc(title)}</h2><p>${esc(message)}</p></div>`
    );
  }
}
