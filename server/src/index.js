import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('❌ عيّن JWT_SECRET (16 حرفاً على الأقل) في ملف .env');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);

// CSP معطّلة هنا لتبقى الخطوط والصور المرفوعة تعمل؛ فعّلها وخصّصها عند النشر إن أردت
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '7d' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ message: 'المسار غير موجود' }));

// تقديم الواجهة المبنية (client/dist) من نفس الخادم في الإنتاج
const dist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// معالج الأخطاء
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === '23505') return res.status(409).json({ message: 'القيمة موجودة مسبقاً' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'MulterError') return res.status(422).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'حدث خطأ في الخادم' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 الخادم يعمل على http://localhost:${port}`));
module.exports = app;
