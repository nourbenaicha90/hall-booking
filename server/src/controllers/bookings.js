import { query } from '../db/pool.js';
import { HttpError } from '../middleware/validate.js';
import { notify } from '../utils/notify.js';
import { BOOKING_SELECT, canCancel, createBooking, refreshCompleted } from '../utils/booking.js';

const withFlags = (b) => ({ ...b, can_cancel: canCancel(b) });

export async function create(req, res) {
  const { sectionId, date, startTime, hours, guests, occasionType, notes } = req.body;
  const b = await createBooking({
    userId: req.user.id, customerName: req.user.name, customerPhone: req.user.phone,
    sectionId, date, startTime, hours, guests, occasionType, notes,
  });
  // إشعار لكل المسؤولين
  const admins = await query(`SELECT id FROM users WHERE role IN ('admin','superadmin') AND NOT suspended`);
  await Promise.all(admins.rows.map((a) =>
    notify(a.id, 'طلب حجز جديد', `طلب جديد من ${req.user.name} بتاريخ ${b.date} (رقم ${b.id}).`)));
  await notify(req.user.id, 'تم استلام طلب الحجز', `طلبك رقم ${b.id} بانتظار موافقة الإدارة. سنخبرك فور الرد.`);
  res.status(201).json({ booking: b });
}

export async function mine(req, res) {
  await refreshCompleted();
  const { rows } = await query(`${BOOKING_SELECT} WHERE b.user_id=$1 ORDER BY b.date DESC, b.start_time DESC`, [req.user.id]);
  res.json({ bookings: rows.map(withFlags) });
}

async function ownBooking(req) {
  const { rows } = await query(`${BOOKING_SELECT} WHERE b.id=$1`, [req.params.id]);
  const b = rows[0];
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  if (!b || (!isAdmin && b.user_id !== req.user.id)) throw new HttpError(404, 'الحجز غير موجود');
  return b;
}

export async function cancel(req, res) {
  const b = await ownBooking(req);
  if (!canCancel(b)) {
    throw new HttpError(409, `لا يمكن إلغاء الحجز قبل أقل من ${process.env.CANCEL_BEFORE_HOURS || 48} ساعة من الموعد، أو أن حالته لا تسمح بالإلغاء.`);
  }
  await query(`UPDATE bookings SET status='cancelled' WHERE id=$1`, [b.id]);
  const admins = await query(`SELECT id FROM users WHERE role IN ('admin','superadmin') AND NOT suspended`);
  await Promise.all(admins.rows.map((a) => notify(a.id, 'إلغاء حجز', `ألغى ${b.customer_name} الحجز رقم ${b.id} (${b.date}).`)));
  res.json({ ok: true });
}

// بيانات الفاتورة (تُطبع كـ PDF من المتصفح)
export async function invoice(req, res) {
  const b = await ownBooking(req);
  const [payments, hall] = await Promise.all([
    query('SELECT * FROM payments WHERE booking_id=$1 ORDER BY paid_at', [b.id]),
    query('SELECT name,address,phone,email FROM halls WHERE id=$1', [b.hall_id]),
  ]);
  res.json({ booking: b, payments: payments.rows, hall: hall.rows[0] });
}

// ===== الإشعارات =====
export async function notifications(req, res) {
  const { rows } = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
  res.json({ notifications: rows, unread: rows.filter((n) => !n.read).length });
}

export async function markRead(req, res) {
  await query('UPDATE notifications SET read=true WHERE user_id=$1 AND ($2::int IS NULL OR id=$2)', [req.user.id, req.params.id || null]);
  res.json({ ok: true });
}
