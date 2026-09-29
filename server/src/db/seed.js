import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

// ⚠️ يمسح كل البيانات الموجودة ثم يُدخل بيانات تجريبية
const hash = (p) => bcrypt.hashSync(p, 10);
const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const c = await pool.connect();
try {
  await c.query('BEGIN');
  await c.query(`TRUNCATE notifications, payments, blocked_days, bookings, testimonials, services, sections, halls, users RESTART IDENTITY CASCADE`);

  await c.query(
    `INSERT INTO users(name,email,phone,password_hash,role) VALUES
     ('المدير العام','superadmin@hall.test','0550000001',$1,'superadmin'),
     ('مسؤول الحجوزات','admin@hall.test','0550000002',$2,'admin'),
     ('أمين بن علي','user@hall.test','0550000003',$3,'user'),
     ('ليلى حداد','laila@hall.test','0550000004',$3,'user')`,
    [hash('Super@123'), hash('Admin@123'), hash('User@123')]
  );

  await c.query(
    `INSERT INTO halls(name,tagline,description,capacity,price_per_hour,address,phone,email,instagram,facebook)
     VALUES('قاعة الأندلس','حيث تبدأ أجمل الذكريات',
     'قاعة مناسبات فاخرة تجمع بين الطابع المعماري الأصيل والتجهيزات الحديثة، بأركان متعددة تناسب الأعراس والمؤتمرات وأعياد الميلاد.',
     600,8000,'شارع الاستقلال، وسط المدينة','0550 00 00 00','contact@hall.test','https://instagram.com/','https://facebook.com/')`
  );

  await c.query(
    `INSERT INTO sections(hall_id,name,description,price,capacity) VALUES
     (1,'ركن الأعراس','القاعة الكبرى بمنصة عروسين وإضاءة مسرحية ومساحة رقص واسعة.',15000,500),
     (1,'ركن المؤتمرات','مقاعد مريحة وشاشات عرض ونظام صوت للمحاضرات والاجتماعات.',9000,300),
     (1,'ركن أعياد الميلاد','مساحة مرحة قابلة للتزيين حسب موضوع الحفل.',6000,120),
     (1,'ركن الندوات','قاعة هادئة للمحاضرات وورش العمل واللقاءات الصغيرة.',5000,80)`
  );

  await c.query(
    `INSERT INTO services(name,description,price,icon) VALUES
     ('الضيافة','بوفيه مفتوح وقهوة وحلويات وطاقم تقديم محترف.',0,'🍽️'),
     ('الديكور','تصميم وتنفيذ ديكور يناسب طابع مناسبتك.',0,'💐'),
     ('التصوير','مصوّر فوتوغرافي وفيديو مع ألبوم جاهز للتسليم.',0,'📸'),
     ('DJ وصوتيات','منسّق موسيقي ونظام صوت واضح في كل زاوية.',0,'🎧'),
     ('تنظيم الحفلات','منسّق يتابع الجدول ويستقبل الضيوف نيابةً عنك.',0,'📋'),
     ('مواقف وأمن','مواقف واسعة وفريق أمن وتنظيم دخول.',0,'🛡️')`
  );

  await c.query(
    `INSERT INTO testimonials(name,text,rating) VALUES
     ('سارة و ياسين','كان حفل زفافنا كما حلمنا تماماً. الفريق منظم والقاعة رائعة.',5),
     ('م. عبد الرحمن','استضفنا مؤتمر شركتنا هنا، والصوتيات والتنظيم كانا ممتازين.',5),
     ('أم رنا','احتفلنا بعيد ميلاد ابنتي، وكل التفاصيل كانت مرتبة بعناية.',4)`
  );

  await c.query(
    `INSERT INTO bookings(user_id,customer_name,customer_phone,hall_id,section_id,date,start_time,end_time,guests,occasion_type,status,payment_status,deposit_amount,total_amount,notes) VALUES
     (3,'أمين بن علي','0550000003',1,1,$1,'18:00','23:00',350,'wedding','confirmed','deposit_paid',22500,75000,'نحتاج منصة إضافية'),
     (4,'ليلى حداد','0550000004',1,3,$2,'15:00','19:00',80,'birthday','pending','unpaid',7200,24000,''),
     (3,'أمين بن علي','0550000003',1,2,$3,'09:00','13:00',150,'conference','completed','fully_paid',10800,36000,''),
     (4,'ليلى حداد','0550000004',1,4,$4,'10:00','12:00',40,'seminar','rejected','unpaid',3000,10000,'')`,
    [day(12), day(19), day(-20), day(30)]
  );
  await c.query(
    `INSERT INTO payments(booking_id,amount,method,paid_at) VALUES
     (1,22500,'cash',now() - interval '2 days'),
     (3,10800,'card',now() - interval '25 days'),
     (3,25200,'transfer',now() - interval '21 days')`
  );
  await c.query(`INSERT INTO blocked_days(date,reason) VALUES ($1,'صيانة دورية')`, [day(25)]);
  await c.query(
    `INSERT INTO notifications(user_id,title,message) VALUES (3,'تم تأكيد حجزك','تم تأكيد حجزك رقم 1 في ركن الأعراس.')`
  );

  await c.query('COMMIT');
  console.log(`✅ تمت تعبئة البيانات التجريبية

حسابات الدخول:
  مدير عام : superadmin@hall.test / Super@123
  مسؤول    : admin@hall.test      / Admin@123
  زبون     : user@hall.test       / User@123`);
} catch (e) {
  await c.query('ROLLBACK');
  console.error('❌ فشلت التعبئة:', e.message);
  process.exitCode = 1;
} finally {
  c.release();
  await pool.end();
}
