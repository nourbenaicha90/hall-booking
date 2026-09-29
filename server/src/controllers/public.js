import { query } from '../db/pool.js';
import { HttpError } from '../middleware/validate.js';

// كل بيانات الصفحة الرئيسية في طلب واحد
export async function catalog(req, res) {
  const [hall, sections, services, testimonials] = await Promise.all([
    query('SELECT * FROM halls ORDER BY id LIMIT 1'),
    query('SELECT * FROM sections WHERE active ORDER BY id'),
    query('SELECT * FROM services WHERE active ORDER BY id'),
    query('SELECT * FROM testimonials ORDER BY id DESC LIMIT 6'),
  ]);
  res.json({
    hall: hall.rows[0] || null,
    sections: sections.rows,
    services: services.rows,
    testimonials: testimonials.rows,
    settings: {
      depositPercent: Number(process.env.DEPOSIT_PERCENT || 30),
      cancelBeforeHours: Number(process.env.CANCEL_BEFORE_HOURS || 48),
    },
  });
}

// توفر ركن معيّن خلال شهر (بدون كشف بيانات الزبائن)
export async function availability(req, res) {
  const { sectionId, month } = req.query;
  if (!/^\d{4}-\d{2}$/.test(month || '')) throw new HttpError(422, 'صيغة الشهر يجب أن تكون YYYY-MM');
  const start = `${month}-01`;
  const [bookings, blocked] = await Promise.all([
    query(
      `SELECT date,start_time,end_time,status FROM bookings
       WHERE section_id=$1 AND date >= $2::date AND date < ($2::date + interval '1 month')
         AND status IN ('pending','confirmed','completed') ORDER BY date,start_time`,
      [sectionId, start]
    ),
    query(
      `SELECT date,reason FROM blocked_days WHERE date >= $1::date AND date < ($1::date + interval '1 month')`,
      [start]
    ),
  ]);
  res.json({ bookings: bookings.rows, blocked: blocked.rows });
}
