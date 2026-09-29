import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

// التحقق من رمز JWT وتحميل المستخدم الحالي
export async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'يجب تسجيل الدخول أولاً' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await query(
      'SELECT id,name,email,phone,role,suspended FROM users WHERE id=$1',
      [payload.id]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'الحساب غير موجود' });
    if (user.suspended) return res.status(403).json({ message: 'هذا الحساب معلّق. تواصل مع الإدارة.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'انتهت الجلسة، سجّل الدخول من جديد' });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'ليست لديك صلاحية لهذا الإجراء' });

export const adminOnly = requireRole('admin', 'superadmin');
export const superAdminOnly = requireRole('superadmin');
