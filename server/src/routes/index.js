import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';


import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { body, param } from 'express-validator';
import { auth, adminOnly, superAdminOnly } from '../middleware/auth.js';
import { validate, wrap, HttpError } from '../middleware/validate.js';
import * as A from '../controllers/auth.js';
import * as P from '../controllers/public.js';
import * as B from '../controllers/bookings.js';
import * as D from '../controllers/admin.js';
import { OCCASIONS } from '../utils/booking.js';

const r = Router();
const dir = path.dirname(fileURLToPath(import.meta.url));

// حدّ أشد على مسارات الدخول والتسجيل (ضد تخمين كلمات المرور)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { message: 'محاولات كثيرة، حاول مرة أخرى بعد قليل' },
});

// ---------- قواعد التحقق ----------
const email = body('email').isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail();
const password = (f = 'password') => body(f).isLength({ min: 8 }).withMessage('كلمة المرور 8 أحرف على الأقل');
const date = (f = 'date') => body(f).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('صيغة التاريخ غير صحيحة');
const time = (f) => body(f).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('صيغة الوقت غير صحيحة');
const id = param('id').isInt({ min: 1 }).withMessage('معرّف غير صالح');

const bookingRules = [
  body('sectionId').isInt({ min: 1 }).withMessage('اختر الركن'),
  date(), time('startTime'),
  body('hours').isFloat({ min: 1, max: 16 }).withMessage('عدد الساعات بين 1 و 16').toFloat(),
  body('guests').isInt({ min: 1, max: 5000 }).withMessage('عدد الضيوف غير صالح').toInt(),
  body('occasionType').isIn(OCCASIONS).withMessage('نوع المناسبة غير صالح'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('الملاحظات طويلة جداً'),
];

// ---------- المصادقة ----------
r.post('/auth/register', authLimiter,
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('الاسم مطلوب'),
  email, body('phone').trim().matches(/^[0-9+\s-]{8,20}$/).withMessage('رقم الهاتف غير صالح'), password(), validate, wrap(A.register));
r.post('/auth/login', authLimiter, email, body('password').notEmpty().withMessage('أدخل كلمة المرور'), validate, wrap(A.login));
r.post('/auth/admin-login', authLimiter, email, body('password').notEmpty().withMessage('أدخل كلمة المرور'), validate, wrap(A.adminLogin));
r.post('/auth/forgot-password', authLimiter, email, validate, wrap(A.forgotPassword));
r.post('/auth/reset-password', authLimiter, body('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('رابط غير صالح'), password(), validate, wrap(A.resetPassword));
r.get('/auth/me', auth, wrap(A.me));
r.put('/auth/me', auth,
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().matches(/^[0-9+\s-]{8,20}$/).withMessage('رقم الهاتف غير صالح'), validate, wrap(A.updateMe));
r.put('/auth/password', auth, body('currentPassword').notEmpty().withMessage('أدخل كلمة المرور الحالية'), password('newPassword'), validate, wrap(A.changePassword));

// ---------- عامة ----------
r.get('/catalog', wrap(P.catalog));
r.get('/availability', wrap(P.availability));

// ---------- الزبون ----------
r.post('/bookings', auth, bookingRules, validate, wrap(B.create));
r.get('/bookings/mine', auth, wrap(B.mine));
r.post('/bookings/:id/cancel', auth, id, validate, wrap(B.cancel));
r.get('/bookings/:id/invoice', auth, id, validate, wrap(B.invoice));
r.get('/notifications', auth, wrap(B.notifications));
r.put('/notifications/read', auth, wrap(B.markRead));
r.put('/notifications/:id/read', auth, id, validate, wrap(B.markRead));

// ---------- المسؤول ----------
const admin = Router();
admin.use(auth, adminOnly);

admin.get('/stats', wrap(D.stats));
admin.get('/bookings', wrap(D.listBookings));
admin.post('/bookings',
  body('customerName').trim().isLength({ min: 2 }).withMessage('اسم الزبون مطلوب'),
  ...bookingRules, body('status').optional().isIn(['pending', 'confirmed']), validate, wrap(D.manualBooking));
admin.put('/bookings/:id', id,
  body('status').optional().isIn(['pending', 'confirmed', 'rejected', 'completed', 'cancelled']),
  body('payment_status').optional().isIn(['unpaid', 'deposit_paid', 'fully_paid']),
  body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('start_time').optional().matches(/^([01]\d|2[0-3]):[0-5]\d/),
  body('end_time').optional().matches(/^([01]\d|2[0-3]):[0-5]\d/),
  body('total_amount').optional().isFloat({ min: 0 }).toFloat(),
  body('deposit_amount').optional().isFloat({ min: 0 }).toFloat(),
  body('guests').optional().isInt({ min: 1 }).toInt(),
  validate, wrap(D.updateBooking));
admin.delete('/bookings/:id', id, validate, wrap(D.deleteBooking));
admin.post('/bookings/:id/payments', id,
  body('amount').isFloat({ gt: 0 }).withMessage('المبلغ يجب أن يكون أكبر من صفر').toFloat(),
  body('method').optional().isIn(['cash', 'card', 'transfer', 'online']), validate, wrap(D.addPayment));

admin.get('/calendar', wrap(D.calendar));
admin.post('/blocked-days', date(), validate, wrap(D.blockDay));
admin.delete('/blocked-days/:date', param('date').matches(/^\d{4}-\d{2}-\d{2}$/), validate, wrap(D.unblockDay));

for (const [path_, table] of [['sections', 'sections'], ['services', 'services'], ['testimonials', 'testimonials']]) {
  const c = D.crud(table);
  admin.get(`/${path_}`, wrap(c.list));
  admin.post(`/${path_}`, body('name').trim().notEmpty().withMessage('الاسم مطلوب'), validate, wrap(c.create));
  admin.put(`/${path_}/:id`, id, validate, wrap(c.update));
  admin.delete(`/${path_}/:id`, id, validate, wrap(c.remove));
}
admin.put('/hall', validate, wrap(D.updateHall));

admin.get('/payments', wrap(D.listPayments));
admin.post('/payments/:id/refund', id, validate, wrap(D.refundPayment));
admin.get('/reports/financial', wrap(D.financialReport));

admin.get('/users', wrap(D.listUsers));
admin.put('/users/:id/suspend', id, body('suspended').isBoolean(), validate, wrap(D.setSuspended));
admin.delete('/users/:id', superAdminOnly, id, validate, wrap(D.deleteUser));
admin.post('/admins', superAdminOnly,
  body('name').trim().notEmpty(), email, password(), validate, wrap(D.createAdmin));

// رفع الصور (Multer). لاستخدام Cloudinary استبدل storage بـ multer-storage-cloudinary
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: path.join(dir, '..', '..', 'uploads'),
//     filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + path.extname(file.originalname).toLowerCase()),
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) =>
//     /^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype) ? cb(null, true) : cb(new HttpError(422, 'الملف يجب أن يكون صورة (JPG / PNG / WEBP)')),
// });
// admin.post('/upload', upload.single('image'), (req, res) => {
//   if (!req.file) throw new HttpError(422, 'لم يتم اختيار ملف');
//   res.status(201).json({ url: `/uploads/${req.file.filename}` });
// });


// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// تخزين الصور على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hall-booking',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1600, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype) 
      ? cb(null, true) 
      : cb(new HttpError(422, 'الملف يجب أن يكون صورة (JPG / PNG / WEBP)')),
});

admin.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(422, 'لم يتم اختيار ملف');
  // Cloudinary يعيد الرابط الكامل في req.file.path
  res.status(201).json({ url: req.file.path });
});


r.use('/admin', admin);
export default r;
