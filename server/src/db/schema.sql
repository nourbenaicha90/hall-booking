-- مخطط قاعدة البيانات (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  phone VARCHAR(30) NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role VARCHAR(12) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','superadmin')),
  suspended BOOLEAN NOT NULL DEFAULT false,
  reset_token_hash TEXT,
  reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS halls (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  tagline VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  capacity INT NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  price_per_hour NUMERIC(12,2) NOT NULL DEFAULT 0,
  address TEXT NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(160) NOT NULL DEFAULT '',
  map_embed_url TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  facebook TEXT NOT NULL DEFAULT ''
);

-- الأركان
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  hall_id INT NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,      -- سعر الساعة
  capacity INT NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  icon VARCHAR(16) NOT NULL DEFAULT '✨',
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  text TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL DEFAULT '',
  hall_id INT NOT NULL REFERENCES halls(id),
  section_id INT NOT NULL REFERENCES sections(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  occasion_type VARCHAR(30) NOT NULL DEFAULT 'other',
  status VARCHAR(12) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','rejected','completed','cancelled')),
  payment_status VARCHAR(14) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','deposit_paid','fully_paid')),
  deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_bookings_section_date ON bookings(section_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method VARCHAR(20) NOT NULL DEFAULT 'cash',
  status VARCHAR(12) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','refunded')),
  note TEXT NOT NULL DEFAULT '',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blocked_days (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
