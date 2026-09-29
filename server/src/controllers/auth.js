import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { HttpError } from '../middleware/validate.js';
import { sendMail } from '../utils/notify.js';

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

export async function register(req, res) {
  const { name, email, phone, password } = req.body;
  const exists = await query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (exists.rows.length) throw new HttpError(409, 'هذا البريد الإلكتروني مسجّل مسبقاً');
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users(name,email,phone,password_hash) VALUES($1,$2,$3,$4) RETURNING *`,
    [name, email, phone, hash]
  );
  res.status(201).json({ token: sign(rows[0].id), user: publicUser(rows[0]) });
}

async function checkCredentials(email, password) {
  const { rows } = await query('SELECT * FROM users WHERE email=$1', [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    throw new HttpError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }
  if (u.suspended) throw new HttpError(403, 'هذا الحساب معلّق. تواصل مع الإدارة.');
  return u;
}

export async function login(req, res) {
  const u = await checkCredentials(req.body.email, req.body.password);
  res.json({ token: sign(u.id), user: publicUser(u) });
}

// دخول لوحة التحكم: للمسؤولين فقط
export async function adminLogin(req, res) {
  const u = await checkCredentials(req.body.email, req.body.password);
  if (!['admin', 'superadmin'].includes(u.role)) throw new HttpError(403, 'هذا الحساب ليس حساب مسؤول');
  res.json({ token: sign(u.id), user: publicUser(u) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function updateMe(req, res) {
  const { name, phone, email } = req.body;
  if (email && email !== req.user.email) {
    const dup = await query('SELECT 1 FROM users WHERE email=$1 AND id<>$2', [email, req.user.id]);
    if (dup.rows.length) throw new HttpError(409, 'هذا البريد مستخدم من حساب آخر');
  }
  const { rows } = await query(
    `UPDATE users SET name=COALESCE($2,name), phone=COALESCE($3,phone), email=COALESCE($4,email) WHERE id=$1 RETURNING *`,
    [req.user.id, name, phone, email]
  );
  res.json({ user: publicUser(rows[0]) });
}

export async function changePassword(req, res) {
  const { rows } = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
  if (!(await bcrypt.compare(req.body.currentPassword, rows[0].password_hash))) {
    throw new HttpError(401, 'كلمة المرور الحالية غير صحيحة');
  }
  await query('UPDATE users SET password_hash=$2 WHERE id=$1', [req.user.id, await bcrypt.hash(req.body.newPassword, 10)]);
  res.json({ ok: true });
}

export async function forgotPassword(req, res) {
  const { rows } = await query('SELECT id,email FROM users WHERE email=$1', [req.body.email]);
  if (rows[0]) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await query(`UPDATE users SET reset_token_hash=$2, reset_expires=now() + interval '1 hour' WHERE id=$1`, [rows[0].id, hash]);
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
    await sendMail(rows[0].email, 'استعادة كلمة المرور',
      `<div dir="rtl"><p>لاستعادة كلمة المرور اضغط على الرابط التالي (صالح لمدة ساعة):</p><p><a href="${link}">${link}</a></p></div>`);
  }
  // نفس الرد دائماً حتى لا نكشف وجود البريد
  res.json({ message: 'إن كان البريد مسجّلاً فقد أرسلنا إليه رابط الاستعادة.' });
}

export async function resetPassword(req, res) {
  const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const { rows } = await query('SELECT id FROM users WHERE reset_token_hash=$1 AND reset_expires > now()', [hash]);
  if (!rows[0]) throw new HttpError(400, 'الرابط غير صالح أو انتهت صلاحيته');
  await query('UPDATE users SET password_hash=$2, reset_token_hash=NULL, reset_expires=NULL WHERE id=$1', [rows[0].id, await bcrypt.hash(req.body.password, 10)]);
  res.json({ message: 'تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.' });
}
