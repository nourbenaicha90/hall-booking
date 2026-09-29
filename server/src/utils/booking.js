import { query } from '../db/pool.js';
import { HttpError } from '../middleware/validate.js';

export const OCCASIONS = ['wedding', 'engagement', 'birthday', 'conference', 'seminar', 'other'];

const pad = (n) => String(n).padStart(2, '0');

// يحسب وقت النهاية من وقت البداية وعدد الساعات (ضمن نفس اليوم)
export function computeEnd(startTime, hours) {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + Math.round(Number(hours) * 60);
  if (total > 24 * 60) throw new HttpError(422, 'يجب أن ينتهي الحجز قبل منتصف الليل. اختر وقتاً أبكر أو ساعات أقل.');
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`.replace(/^00:00$/, '23:59');
}

export function hoursBetween(start, end) {
  const [a, b] = start.split(':').map(Number);
  let [c, d] = end.split(':').map(Number);
  if (c === 23 && d === 59) { c = 24; d = 0; } // 23:59 تعني نهاية اليوم
  return (c * 60 + d - (a * 60 + b)) / 60;
}

// حجوزات مؤكَّدة تتعارض في نفس الركن والتاريخ والوقت
export async function hasConfirmedConflict(sectionId, date, start, end, excludeId = null) {
  const { rows } = await query(
    `SELECT id FROM bookings
     WHERE section_id=$1 AND date=$2 AND status IN ('confirmed','completed')
       AND start_time < $4::time AND end_time > $3::time
       AND ($5::int IS NULL OR id <> $5) LIMIT 1`,
    [sectionId, date, start, end, excludeId]
  );
  return rows.length > 0;
}

export async function isBlocked(date) {
  const { rows } = await query('SELECT reason FROM blocked_days WHERE date=$1', [date]);
  return rows[0] || null;
}

// الحجوزات المؤكدة التي انتهى وقتها تصبح "منتهية"
export async function refreshCompleted() {
  await query(`UPDATE bookings SET status='completed' WHERE status='confirmed' AND (date + end_time) < now()`);
}

// يعيد احتساب حالة الدفع من مجموع الدفعات المسجّلة
export async function recalcPayment(bookingId) {
  const { rows } = await query(
    `SELECT b.total_amount,
            COALESCE((SELECT SUM(amount) FROM payments p WHERE p.booking_id=b.id AND p.status='completed'),0) AS paid
     FROM bookings b WHERE b.id=$1`,
    [bookingId]
  );
  if (!rows[0]) return;
  const { total_amount: total, paid } = rows[0];
  const status = total > 0 && paid >= total ? 'fully_paid' : paid > 0 ? 'deposit_paid' : 'unpaid';
  await query('UPDATE bookings SET payment_status=$2 WHERE id=$1', [bookingId, status]);
}

// إنشاء حجز (يستخدمه الزبون والمسؤول)
export async function createBooking({ userId, customerName, customerPhone, sectionId, date, startTime, hours, guests, occasionType, notes, status, byAdmin }) {
  const { rows } = await query('SELECT s.*, h.id AS hid FROM sections s JOIN halls h ON h.id=s.hall_id WHERE s.id=$1 AND s.active', [sectionId]);
  const section = rows[0];
  if (!section) throw new HttpError(404, 'الركن المطلوب غير موجود');
  if (guests > section.capacity) throw new HttpError(422, `سعة هذا الركن ${section.capacity} شخصاً كحد أقصى`);

  const today = new Date().toISOString().slice(0, 10);
  if (!byAdmin && date < today) throw new HttpError(422, 'لا يمكن الحجز في تاريخ سابق');

  const endTime = computeEnd(startTime, hours);
  if (!byAdmin) {
    const blocked = await isBlocked(date);
    if (blocked) throw new HttpError(409, 'هذا اليوم غير متاح للحجز');
  }
  if (await hasConfirmedConflict(sectionId, date, startTime, endTime)) {
    throw new HttpError(409, 'هذا الوقت محجوز مسبقاً في هذا الركن. اختر وقتاً أو يوماً آخر.');
  }

  const total = Math.round(hoursBetween(startTime, endTime) * section.price * 100) / 100;
  const deposit = Math.round(total * (Number(process.env.DEPOSIT_PERCENT || 30) / 100) * 100) / 100;

  const ins = await query(
    `INSERT INTO bookings(user_id,customer_name,customer_phone,hall_id,section_id,date,start_time,end_time,guests,occasion_type,status,deposit_amount,total_amount,notes,created_by_admin)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [userId || null, customerName, customerPhone || '', section.hid, sectionId, date, startTime, endTime, guests,
     OCCASIONS.includes(occasionType) ? occasionType : 'other', status || 'pending', deposit, total, notes || '', !!byAdmin]
  );
  return ins.rows[0];
}

export const BOOKING_SELECT = `
  SELECT b.*, s.name AS section_name, u.email AS user_email,
         COALESCE((SELECT SUM(amount) FROM payments p WHERE p.booking_id=b.id AND p.status='completed'),0) AS paid_amount
  FROM bookings b
  JOIN sections s ON s.id=b.section_id
  LEFT JOIN users u ON u.id=b.user_id`;

// هل يمكن للزبون إلغاء الحجز؟
export function canCancel(b) {
  if (!['pending', 'confirmed'].includes(b.status)) return false;
  const start = new Date(`${b.date}T${b.start_time}`);
  const hoursLeft = (start.getTime() - Date.now()) / 36e5;
  return hoursLeft >= Number(process.env.CANCEL_BEFORE_HOURS || 48);
}
