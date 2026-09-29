# نظام حجز قاعة الحفلات

تطبيق ويب متكامل (Full-Stack) لحجز قاعة مناسبات: واجهة للزوار والزبائن، ولوحة تحكم للمسؤول.

| الطبقة | التقنية |
|---|---|
| الواجهة | React 18 + Vite + Tailwind CSS + React Router + Framer Motion + Recharts |
| الخادم | Node.js (≥18) + Express |
| قاعدة البيانات | PostgreSQL (بدون ORM، استعلامات مُعلَّمة عبر `pg`) |
| المصادقة | JWT + bcryptjs |
| الأمان | Helmet، Rate Limiting، express-validator، رفع صور مقيَّد (Multer) |
| البريد | Nodemailer (اختياري: بدون SMTP تُطبع الرسائل في الطرفية) |

## بنية المشروع

```
hall-booking/
├── server/
│   ├── .env.example
│   ├── uploads/                 # الصور المرفوعة
│   └── src/
│       ├── index.js             # نقطة التشغيل
│       ├── db/                  # pool.js · schema.sql · init.js · seed.js
│       ├── middleware/          # auth.js · validate.js
│       ├── controllers/         # auth · public · bookings · admin
│       ├── routes/index.js      # كل المسارات + قواعد التحقق
│       └── utils/               # booking.js (منطق الحجز) · notify.js (إشعارات + بريد)
└── client/
    └── src/
        ├── pages/               # الرئيسية · الحجز · الحساب · الفاتورة · الدخول
        ├── admin/               # لوحة التحكم
        ├── components/          # التقويم · الشريط العلوي · عناصر مشتركة
        └── i18n.jsx             # عربي / إنجليزي مع RTL
```

## التشغيل محلياً

المتطلبات: Node.js 18+ و PostgreSQL 13+.

```bash
# 1) أنشئ قاعدة البيانات
createdb hall_booking            # أو من psql: CREATE DATABASE hall_booking;

# 2) الخادم
cd server
cp .env.example .env             # عدّل DATABASE_URL و JWT_SECRET
npm install
npm run db:init                  # إنشاء الجداول
npm run db:seed                  # بيانات تجريبية (يمسح البيانات الموجودة)
npm run dev                      # http://localhost:5000

# 3) الواجهة (في طرفية أخرى)
cd client
npm install
npm run dev                      # http://localhost:5173  (يوجّه /api إلى الخادم تلقائياً)
```

### حسابات التجربة (من `db:seed`)

| الدور | البريد | كلمة المرور |
|---|---|---|
| مدير عام | superadmin@hall.test | Super@123 |
| مسؤول | admin@hall.test | Admin@123 |
| زبون | user@hall.test | User@123 |

لوحة التحكم: `/admin` (تسجيل الدخول من `/admin/login`).

## قواعد العمل المهمة

- **الحجز على مستوى الركن:** الركن الواحد لا يقبل حجزين مؤكَّدين متداخلين في نفس الوقت. الأركان المختلفة مستقلة.
- **حالات التقويم:** أخضر متاح · أصفر فيه طلب معلّق (يمكن الطلب) · أحمر فيه حجز مؤكَّد (معطّل) · رمادي محجوب/ماضٍ.
- **الطلب الجديد** يُنشأ بحالة «بانتظار التأكيد»؛ التعارض يُفحص عند الإرسال وعند تأكيد المسؤول.
- **العربون** = `DEPOSIT_PERCENT` من المبلغ (30% افتراضياً). حالة الدفع (غير مدفوع / عربون / كامل) تُحسب تلقائياً من الدفعات المسجَّلة.
- **الإلغاء** للزبون مسموح قبل الموعد بـ `CANCEL_BEFORE_HOURS` ساعة على الأقل.
- **«منتهٍ»**: الحجز المؤكَّد الذي مضى وقته يتحوّل تلقائياً إلى Completed.
- الحجز لا يتجاوز منتصف الليل (يبدأ وينتهي في اليوم نفسه).
- **الصلاحيات:** Admin يدير الحجوزات والمدفوعات والمحتوى؛ Super Admin يضيف مسؤولين ويحذف الحسابات.

## النشر (خدمة واحدة)

الخادم يقدّم الواجهة المبنية تلقائياً من `client/dist`، فيكفي نشر خدمة واحدة:

```bash
cd client && npm install && npm run build        # ينتج client/dist
cd ../server && npm install --omit=dev
NODE_ENV=production npm start
```

على Render / Railway / Fly أو VPS:

1. أنشئ قاعدة PostgreSQL وضع رابطها في `DATABASE_URL` (وفعّل `DB_SSL=true` إن لزم).
2. عيّن `JWT_SECRET` طويلاً وعشوائياً، و`CLIENT_URL` برابط موقعك.
3. شغّل مرة واحدة `npm run db:init`. لا تشغّل `db:seed` في الإنتاج (يمسح البيانات)؛ أنشئ مسؤولك الأول بتعديل بيانات seed محلياً أو بإدخال صف في جدول users.
4. على VPS: شغّل الخادم عبر `pm2 start src/index.js` وضع Nginx كوكيل عكسي مع شهادة HTTPS (Let's Encrypt).
5. الصور المرفوعة تُحفظ في `server/uploads`؛ على منصات بلا قرص دائم استبدل Multer بـ Cloudinary (الموضع الوحيد: `routes/index.js`).

## ملاحظات وحدود حالية

- **بوابة الدفع الإلكتروني (Stripe/PayPal/محلية) غير مدمجة.** الدفعات تُسجَّل يدوياً من لوحة المسؤول (نقداً/بطاقة/تحويل). نقطة الربط المناسبة: `addPayment` في `controllers/admin.js` بعد نجاح الـ webhook.
- **الفاتورة PDF** تُنشأ بطباعة صفحة الفاتورة من المتصفح («طباعة / حفظ PDF») لأن jsPDF لا يدعم الخط العربي دون تضمين ملف خط.
- **SMS** غير مفعّل (اختياري في المواصفات).
- محتوى الأركان والخدمات المخزَّن في القاعدة بلغة واحدة (العربية افتراضياً)؛ واجهة النظام نفسها ثنائية اللغة.
- استُخدمت `bcryptjs` (JavaScript صرف) بدل `bcrypt` لتفادي مشاكل بناء الحزم الأصلية.
- الصور الأولية غير مُضمَّنة: تظهر بدائل زخرفية حتى ترفع الإدارة صورها من «الأركان والخدمات».
