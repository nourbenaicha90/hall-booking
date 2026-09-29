const CUR = import.meta.env.VITE_CURRENCY || 'د.ج';
export const money = (n) => `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${CUR}`;
export const hhmm = (t) => String(t || '').slice(0, 5);
export const pad = (n) => String(n).padStart(2, '0');
export const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const todayISO = () => {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
};
export const monthOf = (dateStr) => dateStr.slice(0, 7);
export const localeOf = (lang) => (lang === 'ar' ? 'ar-u-nu-latn' : 'en-US');
export const fmtDate = (s, lang = 'ar') => {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'long' }).format(new Date(y, m - 1, d));
};
export const fmtDateTime = (s, lang = 'ar') =>
  new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));
export const OCCASIONS = ['wedding', 'engagement', 'birthday', 'conference', 'seminar', 'other'];
export const STATUSES = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
export const PAY_STATUSES = ['unpaid', 'deposit_paid', 'fully_paid'];
