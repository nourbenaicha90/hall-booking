import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function AdminLayout() {
  const { t } = useI18n();
  const items = [['/admin', 'a_dashboard', true], ['/admin/bookings', 'a_bookings'], ['/admin/calendar', 'a_calendar'], ['/admin/catalog', 'a_catalog'], ['/admin/payments', 'a_payments'], ['/admin/users', 'a_users']];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
      <nav aria-label="admin" className="flex shrink-0 gap-1 overflow-x-auto md:w-52 md:flex-col">
        {items.map(([to, k, end]) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `whitespace-nowrap rounded-xl px-4 py-2.5 font-bold transition ${isActive ? 'bg-ink text-gold' : 'text-ink/70 hover:bg-ink/5'}`}>{t(k)}</NavLink>
        ))}
      </nav>
      <main className="min-w-0 flex-1"><Outlet /></main>
    </div>
  );
}
