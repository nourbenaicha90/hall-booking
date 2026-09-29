import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { HttpError } from '../middleware/validate.js';
import { notify } from '../utils/notify.js';
import {
  BOOKING_SELECT, createBooking, hasConfirmedConflict, hoursBetween, recalcPayment, refreshCompleted,
} from '../utils/booking.js';

// ===== الحجوزات =====
export async function listBookings(req, res) {
  await refreshCompleted();
  const { date, status, sectionId, paymentStatus, q } = req.query;
  const where = [];
  const params = [];
  const add = (sql, v) => { params.push(v); where.push(sql.replace('?', `$${params.length}`)); };
  if (date) add('b.date = ?', date);
  if (status) add('b.status = ?', status);
  if (sectionId) add('b.section_id = ?', sectionId);
  if (paymentStatus) add('b.payment_status = ?', paymentStatus);
  if (q) {
    params.push(`%${q}%`);
    where.push(`(b.customer_name ILIKE $${params.length} OR b.customer_phone ILIKE $${params.length})`);
  }
  const sql = `${BOOKING_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY b.date DESC, b.start_time DESC LIMIT 500`;
  const { rows } = await query(sql, params);
  res.json({ bookings: rows });
}

const STATUS_MESSAGES = {
  confirmed: ['تم تأكيد حجزك', (b) => `تم تأكيد حجزك رقم ${b.id} بتاريخ ${b.date}. عربون الحجز المطلوب: ${b.deposit_amount}.`],
  rejected: ['تعذّر قبول حجزك', (b) => `نعتذر، لم نتمكن من قبول طلبك رقم ${b.id} بتاريخ ${b.date}. ${b.admin_notes || ''}`],
  cancelled: ['تم إلغاء حجزك', (b) => `تم إلغاء الحجز رقم ${b.id} بتاريخ ${b.date} من طرف الإدارة.`],
};

export async function updateBooking(req, res) {
  const { rows } = await query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
  const cur = rows[0];
  if (!cur) throw new HttpError(404, 'الحجز غير موجود');

  const EDITABLE = ['date', 'guests', 'status', 'payment_status', 'deposit_amount', 'total_amount', 'notes', 'admin_notes', 'section_id', 'start_time', 'end_time'];
  const f = { ...cur };
  for (const k of EDITABLE) if (req.body[k] !== undefined) f[k] = req.body[k];
  f.start_time = String(f.start_time).slice(0, 5);
  f.end_time = String(f.end_time).slice(0, 5);
  if (f.end_time <= f.start_time) throw new HttpError(422, 'وقت النهاية يجب أن يكون بعد البداية');

  if (['confirmed', 'completed'].includes(f.status) &&
      await hasConfirmedConflict(f.section_id, String(f.date).slice(0, 10), f.start_time, f.end_time, cur.id)) {
    throw new HttpError(409, 'يوجد حجز مؤكَّد آخر يتعارض مع هذا الموعد في نفس الركن');
  }
  // إعادة حساب المبلغ عند تغيير الوقت أو الركن ما لم يحدده المسؤول يدوياً
  if (req.body.total_amount === undefined && (req.body.start_time || req.body.end_time || req.body.section_id)) {
    const s = await query('SELECT price FROM sections WHERE id=$1', [f.section_id]);
    f.total_amount = Math.round(hoursBetween(f.start_time, f.end_time) * s.rows[0].price * 100) / 100;
  }

  const upd = await query(
    `UPDATE bookings SET date=$2,start_time=$3,end_time=$4,guests=$5,status=$6,payment_status=$7,
       total_amount=$8,deposit_amount=$9,notes=$10,admin_notes=$11,section_id=$12 WHERE id=$1 RETURNING *`,
    [cur.id, f.date, f.start_time, f.end_time, f.guests, f.status, f.payment_status, f.total_amount,
     f.deposit_amount, f.notes, f.admin_notes, f.section_id]
  );
  const b = upd.rows[0];
  if (b.status !== cur.status && STATUS_MESSAGES[b.status]) {
    const [title, msg] = STATUS_MESSAGES[b.status];
    await notify(b.user_id, title, msg(b));
  }
  res.json({ booking: b });
}

export async function deleteBooking(req, res) {
  await query('DELETE FROM bookings WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}

// حجز يدوي من المسؤول (زبون حاضر بدون حساب)
export async function manualBooking(req, res) {
  const { customerName, customerPhone, userId, sectionId, date, startTime, hours, guests, occasionType, notes, status } = req.body;
  const b = await createBooking({
    userId, customerName, customerPhone, sectionId, date, startTime, hours, guests,
    occasionType, notes, status: status || 'confirmed', byAdmin: true,
  });
  res.status(201).json({ booking: b });
}

// ===== التقويم والأيام المحجوبة =====
export async function calendar(req, res) {
  await refreshCompleted();
  const { month } = req.query;
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new HttpError(422, 'صيغة الشهر يجب أن تكون YYYY-MM');
  const start = `${month}-01`;
  const [bookings, blocked] = await Promise.all([
    query(`${BOOKING_SELECT} WHERE b.date >= $1::date AND b.date < ($1::date + interval '1 month')
           AND b.status IN ('pending','confirmed','completed') ORDER BY b.date,b.start_time`, [start]),
    query(`SELECT * FROM blocked_days WHERE date >= $1::date AND date < ($1::date + interval '1 month')`, [start]),
  ]);
  res.json({ bookings: bookings.rows, blocked: blocked.rows });
}

export async function blockDay(req, res) {
  const { rows } = await query(
    `INSERT INTO blocked_days(date,reason) VALUES($1,$2)
     ON CONFLICT (date) DO UPDATE SET reason=EXCLUDED.reason RETURNING *`,
    [req.body.date, req.body.reason || '']
  );
  res.status(201).json({ blocked: rows[0] });
}

export async function unblockDay(req, res) {
  await query('DELETE FROM blocked_days WHERE date=$1', [req.params.date]);
  res.json({ ok: true });
}

// ===== الأركان والخدمات والقاعة =====
const TABLES = {
  sections: { cols: ['name', 'description', 'price', 'capacity', 'image', 'active'] },
  services: { cols: ['name', 'description', 'price', 'icon', 'active'] },
  testimonials: { cols: ['name', 'text', 'rating'] },
};

export const crud = (table) => ({
  async list(req, res) {
    const { rows } = await query(`SELECT * FROM ${table} ORDER BY id`);
    res.json({ items: rows });
  },
  async create(req, res) {
    const cols = TABLES[table].cols.filter((c) => req.body[c] !== undefined);
    const vals = cols.map((c) => req.body[c]);
    if (table === 'sections') { cols.push('hall_id'); vals.push(1); }
    const { rows } = await query(
      `INSERT INTO ${table}(${cols.join(',')}) VALUES(${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, vals);
    res.status(201).json({ item: rows[0] });
  },
  async update(req, res) {
    const cols = TABLES[table].cols.filter((c) => req.body[c] !== undefined);
    if (!cols.length) throw new HttpError(422, 'لا توجد بيانات للتحديث');
    const { rows } = await query(
      `UPDATE ${table} SET ${cols.map((c, i) => `${c}=$${i + 2}`).join(',')} WHERE id=$1 RETURNING *`,
      [req.params.id, ...cols.map((c) => req.body[c])]);
    if (!rows[0]) throw new HttpError(404, 'العنصر غير موجود');
    res.json({ item: rows[0] });
  },
  async remove(req, res) {
    try {
      await query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
    } catch (e) {
      // ركن مرتبط بحجوزات: نخفيه بدل حذفه
      if (e.code === '23503' && table === 'sections') {
        await query('UPDATE sections SET active=false WHERE id=$1', [req.params.id]);
        return res.json({ ok: true, deactivated: true });
      }
      throw e;
    }
    res.json({ ok: true });
  },
});

const HALL_COLS = ['name', 'tagline', 'description', 'capacity', 'images', 'price_per_hour', 'address', 'phone', 'email', 'map_embed_url', 'instagram', 'facebook'];
export async function updateHall(req, res) {
  const cols = HALL_COLS.filter((c) => req.body[c] !== undefined);
  const { rows } = await query(
    `UPDATE halls SET ${cols.map((c, i) => `${c}=$${i + 1}`).join(',')} WHERE id=(SELECT id FROM halls ORDER BY id LIMIT 1) RETURNING *`,
    cols.map((c) => req.body[c]));
  res.json({ hall: rows[0] });
}

// ===== المدفوعات =====
export async function listPayments(req, res) {
  const { rows } = await query(
    `SELECT p.*, b.customer_name, b.date AS booking_date, b.total_amount
     FROM payments p JOIN bookings b ON b.id=p.booking_id ORDER BY p.paid_at DESC LIMIT 300`);
  res.json({ payments: rows });
}

export async function addPayment(req, res) {
  const { rows: bk } = await query('SELECT id,user_id FROM bookings WHERE id=$1', [req.params.id]);
  if (!bk[0]) throw new HttpError(404, 'الحجز غير موجود');
  const { amount, method, note, status } = req.body;
  const { rows } = await query(
    'INSERT INTO payments(booking_id,amount,method,note,status) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [bk[0].id, amount, method || 'cash', note || '', status || 'completed']);
  await recalcPayment(bk[0].id);
  await notify(bk[0].user_id, 'تم تسجيل دفعة', `سُجّلت دفعة بقيمة ${amount} على حجزك رقم ${bk[0].id}.`);
  res.status(201).json({ payment: rows[0] });
}

export async function refundPayment(req, res) {
  const { rows } = await query(`UPDATE payments SET status='refunded' WHERE id=$1 RETURNING booking_id`, [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'الدفعة غير موجودة');
  await recalcPayment(rows[0].booking_id);
  res.json({ ok: true });
}

const PERIODS = { day: 'YYYY-MM-DD', month: 'YYYY-MM', year: 'YYYY' };
export async function financialReport(req, res) {
  const period = PERIODS[req.query.period] ? req.query.period : 'month';
  const { rows } = await query(
    `SELECT to_char(date_trunc('${period}', paid_at), '${PERIODS[period]}') AS period,
            SUM(amount) AS total, COUNT(*) AS count
     FROM payments WHERE status='completed' GROUP BY 1 ORDER BY 1 DESC LIMIT 60`);
  res.json({ period, rows });
}

// ===== الإحصائيات =====
export async function stats(req, res) {
  await refreshCompleted();
  const [totals, monthly, revenue, top] = await Promise.all([
    query(`SELECT
      (SELECT COUNT(*) FROM bookings) AS bookings,
      (SELECT COUNT(*) FROM bookings WHERE status='pending') AS pending,
      (SELECT COUNT(*) FROM users WHERE role='user') AS customers,
      COALESCE((SELECT SUM(amount) FROM payments WHERE status='completed'),0) AS revenue,
      COALESCE((SELECT SUM(amount) FROM payments WHERE status='completed' AND date_trunc('month',paid_at)=date_trunc('month',now())),0) AS revenue_month`),
    query(`SELECT to_char(date_trunc('month', date),'YYYY-MM') AS month, COUNT(*) AS count
           FROM bookings WHERE status IN ('pending','confirmed','completed') AND date >= (date_trunc('month', now()) - interval '5 months')
           GROUP BY 1 ORDER BY 1`),
    query(`SELECT to_char(date_trunc('month', paid_at),'YYYY-MM') AS month, SUM(amount) AS total
           FROM payments WHERE status='completed' AND paid_at >= (date_trunc('month', now()) - interval '5 months')
           GROUP BY 1 ORDER BY 1`),
    query(`SELECT s.name, COUNT(*) AS count FROM bookings b JOIN sections s ON s.id=b.section_id
           WHERE b.status IN ('pending','confirmed','completed') GROUP BY s.name ORDER BY count DESC LIMIT 6`),
  ]);
  res.json({ totals: totals.rows[0], monthly: monthly.rows, revenue: revenue.rows, top: top.rows });
}

// ===== المستخدمون =====
export async function listUsers(req, res) {
  const { rows } = await query(
    `SELECT u.id,u.name,u.email,u.phone,u.role,u.suspended,u.created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id=u.id) AS bookings_count
     FROM users u ORDER BY u.created_at DESC`);
  res.json({ users: rows });
}

export async function setSuspended(req, res) {
  const { rows } = await query('SELECT role FROM users WHERE id=$1', [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'المستخدم غير موجود');
  if (Number(req.params.id) === req.user.id) throw new HttpError(409, 'لا يمكنك تعليق حسابك أنت');
  if (rows[0].role !== 'user' && req.user.role !== 'superadmin') throw new HttpError(403, 'فقط المدير العام يعدّل حسابات المسؤولين');
  await query('UPDATE users SET suspended=$2 WHERE id=$1', [req.params.id, !!req.body.suspended]);
  res.json({ ok: true });
}

export async function deleteUser(req, res) {
  if (Number(req.params.id) === req.user.id) throw new HttpError(409, 'لا يمكنك حذف حسابك أنت');
  await query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
}

// المدير العام فقط: إنشاء حساب مسؤول
export async function createAdmin(req, res) {
  const { name, email, phone, password, role } = req.body;
  const dup = await query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (dup.rows.length) throw new HttpError(409, 'البريد مسجّل مسبقاً');
  const { rows } = await query(
    `INSERT INTO users(name,email,phone,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role`,
    [name, email, phone || '', await bcrypt.hash(password, 10), role === 'superadmin' ? 'superadmin' : 'admin']);
  res.status(201).json({ user: rows[0] });
}
