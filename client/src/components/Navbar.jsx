import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';
import { api } from '../api';

export default function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user, logout, isAdmin } = useAuth();
  const { data } = useCatalog();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return setUnread(0);
    api.get('/notifications').then((d) => setUnread(d.unread)).catch(() => {});
  }, [user]);

  const links = [['/#services', 'nav_services'], ['/#sections', 'nav_sections'], ['/#gallery', 'nav_gallery'], ['/#contact', 'nav_contact']];
  const close = () => setOpen(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-gold/20 bg-ink/95 text-ivory backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-display text-xl font-black text-gold" onClick={close}>{data?.hall?.name || t('brand_default')}</Link>

        <nav className={`${open ? 'flex' : 'hidden'} absolute inset-x-0 top-full flex-col gap-1 border-b border-gold/20 bg-ink p-4 md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0`}>
          {links.map(([to, k]) => <Link key={k} to={to} onClick={close} className="py-1 text-sm text-ivory/80 hover:text-gold">{t(k)}</Link>)}
          <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn btn-ghost btn-sm">{t('lang_switch')}</button>
            {user ? (
              <>
                {isAdmin && <NavLink to="/admin" onClick={close} className="btn btn-ghost btn-sm">{t('admin_panel')}</NavLink>}
                <NavLink to="/account" onClick={close} className="btn btn-ghost btn-sm">
                  {t('my_account')}{unread > 0 && <span className="rounded-full bg-gold px-1.5 text-xs font-black text-ink">{unread}</span>}
                </NavLink>
                <button onClick={() => { logout(); close(); nav('/'); }} className="btn btn-sm text-ivory/70 hover:text-gold">{t('logout')}</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={close} className="btn btn-sm text-ivory/80 hover:text-gold">{t('login')}</NavLink>
                <NavLink to="/register" onClick={close} className="btn btn-ghost btn-sm">{t('register')}</NavLink>
              </>
            )}
            <Link to="/booking" onClick={close} className="btn btn-gold btn-sm">{t('book_now')}</Link>
          </div>
        </nav>

        <button className="rounded-lg border border-gold/40 px-3 py-1.5 md:hidden" aria-label="menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}</button>
      </div>
    </header>
  );
}
