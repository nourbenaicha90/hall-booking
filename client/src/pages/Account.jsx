import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { Field, Msg, PayBadge, Spinner, StatusBadge } from '../components/Ui';
import { fmtDate, fmtDateTime, hhmm, money } from '../utils';

function Bookings() {
  const { t, lang } = useI18n();
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get('/bookings/mine').then((d) => setList(d.bookings)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (id) => {
    if (!window.confirm(t('confirm_cancel'))) return;
    setErr('');
    try { await api.post(`/bookings/${id}/cancel`); load(); } catch (e) { setErr(e.message); }
  };

  if (!list) return <Spinner />;
  if (!list.length) return <div className="card text-center"><p>{t('no_bookings')}</p><Link to="/booking" className="btn btn-gold mt-4">{t('book_now')}</Link></div>;
  return (
    <div className="space-y-4">
      <Msg>{err}</Msg>
      {list.map((b) => (
        <article key={b.id} className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">{b.section_name} <span className="text-sm font-normal text-ink/50">· {t('booking_no')}{b.id}</span></h3>
              <p className="mt-1 text-ink/70">{fmtDate(b.date, lang)} · <span dir="ltr">{hhmm(b.start_time)} – {hhmm(b.end_time)}</span> · {b.guests} {t('guests_unit')}</p>
            </div>
            <div className="flex gap-2"><StatusBadge status={b.status} /><PayBadge status={b.payment_status} /></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-ivory p-3 text-center text-sm">
            <div><p className="text-ink/60">{t('total')}</p><b>{money(b.total_amount)}</b></div>
            <div><p className="text-ink/60">{t('paid')}</p><b>{money(b.paid_amount)}</b></div>
            <div><p className="text-ink/60">{t('remaining')}</p><b>{money(Math.max(0, b.total_amount - b.paid_amount))}</b></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/invoice/${b.id}`} className="btn btn-line btn-sm">{t('invoice')}</Link>
            {['pending', 'confirmed'].includes(b.status) && (
              <button onClick={() => cancel(b.id)} disabled={!b.can_cancel} title={b.can_cancel ? '' : t('cancel_locked')} className="btn btn-danger btn-sm">{t('cancel_booking')}</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Notifications() {
  const { t, lang } = useI18n();
  const [list, setList] = useState(null);
  useEffect(() => {
    api.get('/notifications').then((d) => { setList(d.notifications); if (d.unread) api.put('/notifications/read').catch(() => {}); });
  }, []);
  if (!list) return <Spinner />;
  if (!list.length) return <p className="card text-center text-ink/60">{t('no_notifications')}</p>;
  return (
    <ul className="space-y-3">
      {list.map((n) => (
        <li key={n.id} className={`card ${n.read ? '' : 'border-s-4 border-gold'}`}>
          <p className="font-black">{n.title}</p>
          <p className="mt-1 text-sm text-ink/70">{n.message}</p>
          <p className="mt-2 text-xs text-ink/40">{fmtDateTime(n.created_at, lang)}</p>
        </li>
      ))}
    </ul>
  );
}

function Profile() {
  const { t } = useI18n();
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, email: user.email, phone: user.phone });
  const [p, setP] = useState({ currentPassword: '', newPassword: '' });
  const [m1, setM1] = useState({}); const [m2, setM2] = useState({});

  const saveProfile = async (e) => {
    e.preventDefault(); setM1({});
    try { const d = await api.put('/auth/me', f); setUser(d.user); setM1({ ok: t('saved') }); } catch (e2) { setM1({ err: e2.message }); }
  };
  const savePass = async (e) => {
    e.preventDefault(); setM2({});
    try { await api.put('/auth/password', p); setP({ currentPassword: '', newPassword: '' }); setM2({ ok: t('password_changed') }); } catch (e2) { setM2({ err: e2.message }); }
  };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={saveProfile} className="card space-y-4">
        <Field label={t('full_name')}><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('email')}><input className="input" type="email" required dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label={t('phone')}><input className="input" required dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Msg>{m1.err}</Msg><Msg type="ok">{m1.ok}</Msg>
        <button className="btn btn-dark">{t('save_changes')}</button>
      </form>
      <form onSubmit={savePass} className="card space-y-4">
        <Field label={t('current_password')}><input className="input" type="password" required dir="ltr" value={p.currentPassword} onChange={(e) => setP({ ...p, currentPassword: e.target.value })} /></Field>
        <Field label={t('new_password')}><input className="input" type="password" required minLength={8} dir="ltr" value={p.newPassword} onChange={(e) => setP({ ...p, newPassword: e.target.value })} /></Field>
        <Msg>{m2.err}</Msg><Msg type="ok">{m2.ok}</Msg>
        <button className="btn btn-dark">{t('reset_password')}</button>
      </form>
    </div>
  );
}

export default function Account() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [tab, setTab] = useState('bookings');
  const tabs = [['bookings', 'tab_bookings'], ['notifications', 'tab_notifications'], ['profile', 'tab_profile']];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">{t('account_title')}</h1>
      <p className="mt-1 text-ink/60">{user.name}</p>
      <div role="tablist" className="my-6 flex gap-2 border-b border-ink/10">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 font-bold ${tab === k ? 'border-gold-deep text-ink' : 'border-transparent text-ink/50'}`}>{t(l)}</button>
        ))}
      </div>
      {tab === 'bookings' && <Bookings />}
      {tab === 'notifications' && <Notifications />}
      {tab === 'profile' && <Profile />}
    </div>
  );
}
