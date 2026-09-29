import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';
import Calendar from '../components/Calendar';
import { Field, Msg, Spinner } from '../components/Ui';
import { OCCASIONS, money, todayISO } from '../utils';

const START_TIMES = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export default function Booking() {
  const { t } = useI18n();
  const { data } = useCatalog();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [sp] = useSearchParams();

  const [sectionId, setSectionId] = useState(Number(sp.get('section')) || null);
  const [date, setDate] = useState(sp.get('date') || '');
  const [month, setMonth] = useState((sp.get('date') || todayISO()).slice(0, 7));
  const [avail, setAvail] = useState({ bookings: [], blocked: [] });
  const [f, setF] = useState({ occasionType: 'wedding', startTime: '18:00', hours: 4, guests: 100, notes: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const sections = data?.sections || [];
  useEffect(() => { if (!sectionId && sections.length) setSectionId(sections[0].id); }, [sections, sectionId]);
  useEffect(() => {
    if (!sectionId) return;
    api.get(`/availability?sectionId=${sectionId}&month=${month}`).then(setAvail).catch(() => {});
  }, [sectionId, month, done]);

  if (!data) return <Spinner />;
  const section = sections.find((s) => s.id === sectionId);
  const total = section ? section.price * f.hours : 0;
  const deposit = (total * (data.settings.depositPercent || 30)) / 100;
  const dayPending = date && avail.bookings.some((b) => String(b.date).slice(0, 10) === date && b.status === 'pending');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!user) return nav('/login', { state: { from: loc.pathname + loc.search } });
    if (!date) return setErr(t('pick_date_first'));
    setBusy(true);
    try {
      await api.post('/bookings', { ...f, sectionId, date, hours: Number(f.hours), guests: Number(f.guests) });
      setDone(true);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl">✓</div>
        <p className="text-xl font-bold leading-9">{t('booking_sent')}</p>
        <Link to="/account" className="btn btn-dark mt-6">{t('view_bookings')}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black">{t('booking_title')}</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label={t('section')}>
            <select className="input" value={sectionId || ''} onChange={(e) => { setSectionId(Number(e.target.value)); setDate(''); }}>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>)}
            </select>
          </Field>
          <Calendar month={month} onMonthChange={setMonth} bookings={avail.bookings} blocked={avail.blocked} selected={date} onSelect={setDate} />
          {dayPending && <Msg type="ok">{t('pending_warn')}</Msg>}
        </div>

        <div className="space-y-4">
          <Field label={t('date')}><input className="input" readOnly value={date} placeholder={t('pick_date_first')} /></Field>
          <Field label={t('occasion')}>
            <select className="input" value={f.occasionType} onChange={set('occasionType')}>
              {OCCASIONS.map((o) => <option key={o} value={o}>{t(`occ_${o}`)}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('start_time')}>
              <select className="input" value={f.startTime} onChange={set('startTime')} dir="ltr">{START_TIMES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label={t('hours')}><input className="input" type="number" min="1" max="16" step="1" value={f.hours} onChange={set('hours')} /></Field>
          </div>
          <Field label={`${t('guests')}${section ? ` (${t('up_to')} ${section.capacity})` : ''}`}>
            <input className="input" type="number" min="1" max={section?.capacity || 5000} value={f.guests} onChange={set('guests')} />
          </Field>
          <Field label={t('notes')}><textarea className="input min-h-24" maxLength={1000} value={f.notes} onChange={set('notes')} /></Field>

          <div className="rounded-2xl bg-ink p-5 text-ivory">
            <div className="flex justify-between"><span>{t('estimate')}</span><b className="text-gold">{money(total)}</b></div>
            <div className="mt-1 flex justify-between text-sm text-ivory/70"><span>{t('deposit')} ({data.settings.depositPercent}%)</span><span>{money(deposit)}</span></div>
          </div>
          <Msg>{err}</Msg>
          <button className="btn btn-gold w-full py-3 text-lg" disabled={busy}>{busy ? t('sending') : user ? t('send_request') : t('login_to_book')}</button>
        </div>
      </form>
    </div>
  );
}
