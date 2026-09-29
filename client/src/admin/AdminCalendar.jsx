import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import Calendar from '../components/Calendar';
import { Msg, StatusBadge } from '../components/Ui';
import { hhmm, todayISO } from '../utils';
import { ManualBookingModal } from './BookingForms';

export default function AdminCalendar() {
  const { t } = useI18n();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [d, setD] = useState({ bookings: [], blocked: [] });
  const [sel, setSel] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [manual, setManual] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get(`/admin/calendar?month=${month}`).then(setD).catch((e) => setErr(e.message)), [month]);
  useEffect(() => { load(); }, [load]);

  const blockedRow = d.blocked.find((b) => String(b.date).slice(0, 10) === sel);
  const dayBookings = d.bookings.filter((b) => String(b.date).slice(0, 10) === sel);
  const act = async (fn) => { setErr(''); try { await fn(); setReason(''); load(); } catch (e) { setErr(e.message); } };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Calendar admin month={month} onMonthChange={setMonth} bookings={d.bookings} blocked={d.blocked} selected={sel} onSelect={setSel} />
      <div className="space-y-4">
        <div className="card">
          <h3 className="text-lg font-black">{sel}</h3>
          <ul className="mt-3 space-y-2">
            {dayBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-xl bg-ivory p-3 text-sm">
                <span><b>{b.customer_name}</b> · {b.section_name}<br /><span dir="ltr">{hhmm(b.start_time)} – {hhmm(b.end_time)}</span></span>
                <StatusBadge status={b.status} />
              </li>
            ))}
            {!dayBookings.length && <li className="text-sm text-ink/60">{t('nothing_that_day')}</li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-gold btn-sm" onClick={() => setManual(true)}>+ {t('manual_booking')}</button>
          </div>
        </div>
        <div className="card space-y-3">
          {blockedRow ? (
            <>
              <p className="text-sm">{t('blocked_reason')}: <b>{blockedRow.reason || '—'}</b></p>
              <button className="btn btn-line btn-sm" onClick={() => act(() => api.del(`/admin/blocked-days/${sel}`))}>{t('unblock_day')}</button>
            </>
          ) : (
            <>
              <input className="input" placeholder={t('reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
              <button className="btn btn-dark btn-sm" onClick={() => act(() => api.post('/admin/blocked-days', { date: sel, reason }))}>{t('block_day')}</button>
            </>
          )}
        </div>
        <Msg>{err}</Msg>
      </div>
      {manual && <ManualBookingModal date={sel} onClose={() => setManual(false)} onSaved={() => { setManual(false); load(); }} />}
    </div>
  );
}
