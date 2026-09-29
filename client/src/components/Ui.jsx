import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';

const TONES = {
  gray: 'bg-ink/10 text-ink/70',
  gold: 'bg-gold/20 text-gold-deep',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-rose-100 text-rose-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-sky-100 text-sky-800',
};
const STATUS_TONE = { pending: 'amber', confirmed: 'green', rejected: 'red', completed: 'blue', cancelled: 'gray' };
const PAY_TONE = { unpaid: 'red', deposit_paid: 'amber', fully_paid: 'green' };

export const Badge = ({ tone = 'gray', children }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}>{children}</span>
);

export function StatusBadge({ status }) {
  const { t } = useI18n();
  return <Badge tone={STATUS_TONE[status]}>{t(`st_${status}`)}</Badge>;
}
export function PayBadge({ status }) {
  const { t } = useI18n();
  return <Badge tone={PAY_TONE[status]}>{t(`pay_${status}`)}</Badge>;
}

// صورة أو بديل أنيق عند غيابها
export function Img({ src, alt = '', className = '', icon = '✦' }) {
  if (src) return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
  return (
    <div aria-hidden className={`pattern-gold flex items-center justify-center bg-ink text-3xl text-gold ${className}`}>{icon}</div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-ivory p-6 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">{title}</h3>
          <button onClick={onClose} aria-label="close" className="rounded-full px-3 py-1 text-2xl leading-none text-ink/50 hover:bg-ink/10">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
  </label>
);

export const Msg = ({ type = 'error', children }) =>
  children ? (
    <p role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${type === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{children}</p>
  ) : null;

export const Spinner = () => {
  const { t } = useI18n();
  return <p className="py-10 text-center text-ink/50">{t('loading')}</p>;
};

// حماية المسارات
export function Protected({ children, admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={admin ? '/admin/login' : '/login'} state={{ from: loc.pathname + loc.search }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
