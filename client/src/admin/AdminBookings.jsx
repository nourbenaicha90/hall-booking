import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';
import { Msg, PayBadge, Spinner, StatusBadge } from '../components/Ui';
import { hhmm, money, PAY_STATUSES, STATUSES } from '../utils';
import { EditBookingModal, ManualBookingModal, PaymentModal } from './BookingForms';

export default function AdminBookings() {
  const { t } = useI18n();
  const { data } = useCatalog();
  const [filters, setFilters] = useState({ date: '', status: '', sectionId: '', paymentStatus: '', q: '' });
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState(null); // {type, booking}

  const load = useCallback(() => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    api.get(`/admin/bookings?${qs}`).then((d) => setRows(d.bookings)).catch((e) => setErr(e.message));
  }, [filters]);
  useEffect(() => { const id = setTimeout(load, 200); return () => clearTimeout(id); }, [load]);

  const setStatus = async (b, status) => {
    setErr('');
    try { await api.put(`/admin/bookings/${b.id}`, { status }); load(); } catch (e) { setErr(e.message); }
  };
  const remove = async (b) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try { await api.del(`/admin/bookings/${b.id}`); load(); } catch (e) { setErr(e.message); }
  };
  const done = () => { setModal(null); load(); };
  const f = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <input type="date" className="input !w-auto" value={filters.date} onChange={f('date')} aria-label={t('date')} />
        <select className="input !w-auto" value={filters.status} onChange={f('status')} aria-label={t('status')}>
          <option value="">{t('status')}: {t('filter_all')}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`st_${s}`)}</option>)}
        </select>
        <select className="input !w-auto" value={filters.sectionId} onChange={f('sectionId')} aria-label={t('section')}>
          <option value="">{t('section')}: {t('filter_all')}</option>{data?.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input !w-auto" value={filters.paymentStatus} onChange={f('paymentStatus')} aria-label={t('payment')}>
          <option value="">{t('payment')}: {t('filter_all')}</option>{PAY_STATUSES.map((s) => <option key={s} value={s}>{t(`pay_${s}`)}</option>)}
        </select>
        <input className="input !w-56" placeholder={t('search')} value={filters.q} onChange={f('q')} />
        <button className="btn btn-gold btn-sm ms-auto" onClick={() => setModal({ type: 'manual' })}>+ {t('manual_booking')}</button>
      </div>
      <Msg>{err}</Msg>

      {!rows ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
          <table className="w-full">
            <thead className="border-b border-ink/10 bg-ivory"><tr>
              <th className="th">#</th><th className="th">{t('customer')}</th><th className="th">{t('section')}</th><th className="th">{t('date')}</th>
              <th className="th">{t('status')}</th><th className="th">{t('payment')}</th><th className="th">{t('total')}</th><th className="th">{t('actions')}</th>
            </tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-ink/5 hover:bg-ivory/60">
                  <td className="td">{b.id}</td>
                  <td className="td"><b>{b.customer_name}</b><br /><span dir="ltr" className="text-xs text-ink/50">{b.customer_phone}</span></td>
                  <td className="td">{b.section_name}</td>
                  <td className="td whitespace-nowrap">{b.date}<br /><span dir="ltr" className="text-xs text-ink/50">{hhmm(b.start_time)}–{hhmm(b.end_time)}</span></td>
                  <td className="td"><StatusBadge status={b.status} /></td>
                  <td className="td"><PayBadge status={b.payment_status} /><br /><span className="text-xs text-ink/50">{money(b.paid_amount)}</span></td>
                  <td className="td whitespace-nowrap">{money(b.total_amount)}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {b.status === 'pending' && <>
                        <button className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setStatus(b, 'confirmed')}>✅ {t('confirm')}</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setStatus(b, 'rejected')}>❌ {t('reject')}</button>
                      </>}
                      <button className="btn btn-line btn-sm" onClick={() => setModal({ type: 'edit', booking: b })}>{t('edit')}</button>
                      <button className="btn btn-line btn-sm" onClick={() => setModal({ type: 'pay', booking: b })}>💰</button>
                      <button className="btn btn-line btn-sm text-wine" onClick={() => remove(b)}>{t('delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="8" className="td py-8 text-center text-ink/50">{t('no_results')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {modal?.type === 'edit' && <EditBookingModal booking={modal.booking} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.type === 'pay' && <PaymentModal booking={modal.booking} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.type === 'manual' && <ManualBookingModal onClose={() => setModal(null)} onSaved={done} />}
    </div>
  );
}
