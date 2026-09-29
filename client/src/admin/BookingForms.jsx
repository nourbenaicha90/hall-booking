import { useState } from 'react';
import { api } from '../api';
import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';
import { Field, Modal, Msg } from '../components/Ui';
import { OCCASIONS, PAY_STATUSES, STATUSES, hhmm, money } from '../utils';

const START_TIMES = Array.from({ length: 16 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

export function EditBookingModal({ booking, onClose, onSaved }) {
  const { t } = useI18n();
  const { data } = useCatalog();
  const [f, setF] = useState({
    date: booking.date, start_time: hhmm(booking.start_time), end_time: hhmm(booking.end_time), guests: booking.guests,
    section_id: booking.section_id, status: booking.status, payment_status: booking.payment_status,
    total_amount: booking.total_amount, deposit_amount: booking.deposit_amount, admin_notes: booking.admin_notes,
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api.put(`/admin/bookings/${booking.id}`, {
        ...f, guests: Number(f.guests), section_id: Number(f.section_id), total_amount: Number(f.total_amount), deposit_amount: Number(f.deposit_amount),
      });
      onSaved();
    } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={`${t('edit')} #${booking.id} — ${booking.customer_name}`} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label={t('section')}><select className="input" value={f.section_id} onChange={set('section_id')}>{data?.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label={t('date')}><input className="input" type="date" required value={f.date} onChange={set('date')} /></Field>
        <Field label={t('start_time')}><input className="input" type="time" required value={f.start_time} onChange={set('start_time')} dir="ltr" /></Field>
        <Field label={t('end_time')}><input className="input" type="time" required value={f.end_time} onChange={set('end_time')} dir="ltr" /></Field>
        <Field label={t('guests')}><input className="input" type="number" min="1" value={f.guests} onChange={set('guests')} /></Field>
        <Field label={t('status')}><select className="input" value={f.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s} value={s}>{t(`st_${s}`)}</option>)}</select></Field>
        <Field label={t('payment')}><select className="input" value={f.payment_status} onChange={set('payment_status')}>{PAY_STATUSES.map((s) => <option key={s} value={s}>{t(`pay_${s}`)}</option>)}</select></Field>
        <Field label={t('total_amount')}><input className="input" type="number" min="0" step="0.01" value={f.total_amount} onChange={set('total_amount')} /></Field>
        <Field label={t('deposit_amount')}><input className="input" type="number" min="0" step="0.01" value={f.deposit_amount} onChange={set('deposit_amount')} /></Field>
        <div className="sm:col-span-2"><Field label={`${t('notes')} (${booking.customer_name})`}><p className="rounded-xl bg-white px-4 py-2.5 text-sm text-ink/70 ring-1 ring-ink/10">{booking.notes || '—'}</p></Field></div>
        <div className="sm:col-span-2"><Field label={t('admin_notes')}><textarea className="input min-h-20" value={f.admin_notes} onChange={set('admin_notes')} /></Field></div>
        <div className="sm:col-span-2 space-y-3"><Msg>{err}</Msg><button className="btn btn-dark w-full">{t('save')}</button></div>
      </form>
    </Modal>
  );
}

export function PaymentModal({ booking, onClose, onSaved }) {
  const { t } = useI18n();
  const remaining = Math.max(0, booking.total_amount - booking.paid_amount);
  const [f, setF] = useState({ amount: remaining || '', method: 'cash', note: '' });
  const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post(`/admin/bookings/${booking.id}/payments`, { ...f, amount: Number(f.amount) }); onSaved(); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={`${t('add_payment')} — #${booking.id}`} onClose={onClose}>
      <p className="mb-4 text-sm text-ink/70">{t('total')}: {money(booking.total_amount)} · {t('paid')}: {money(booking.paid_amount)} · {t('deposit')}: {money(booking.deposit_amount)}</p>
      <form onSubmit={save} className="space-y-4">
        <Field label={t('amount')}><input className="input" type="number" min="1" step="0.01" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label={t('method')}><select className="input" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{['cash', 'card', 'transfer', 'online'].map((m) => <option key={m} value={m}>{t(`m_${m}`)}</option>)}</select></Field>
        <Field label={t('notes')}><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <Msg>{err}</Msg>
        <button className="btn btn-dark w-full">{t('save')}</button>
      </form>
    </Modal>
  );
}

export function ManualBookingModal({ date = '', onClose, onSaved }) {
  const { t } = useI18n();
  const { data } = useCatalog();
  const [f, setF] = useState({ customerName: '', customerPhone: '', sectionId: data?.sections[0]?.id || '', date, startTime: '18:00', hours: 4, guests: 100, occasionType: 'wedding', status: 'confirmed', notes: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.post('/admin/bookings', { ...f, sectionId: Number(f.sectionId), hours: Number(f.hours), guests: Number(f.guests) }); onSaved(); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Modal title={t('manual_booking')} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label={t('customer_name')}><input className="input" required value={f.customerName} onChange={set('customerName')} /></Field>
        <Field label={t('customer_phone')}><input className="input" dir="ltr" value={f.customerPhone} onChange={set('customerPhone')} /></Field>
        <Field label={t('section')}><select className="input" value={f.sectionId} onChange={set('sectionId')}>{data?.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label={t('date')}><input className="input" type="date" required value={f.date} onChange={set('date')} /></Field>
        <Field label={t('start_time')}><select className="input" dir="ltr" value={f.startTime} onChange={set('startTime')}>{START_TIMES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label={t('hours')}><input className="input" type="number" min="1" max="16" value={f.hours} onChange={set('hours')} /></Field>
        <Field label={t('guests')}><input className="input" type="number" min="1" value={f.guests} onChange={set('guests')} /></Field>
        <Field label={t('occasion')}><select className="input" value={f.occasionType} onChange={set('occasionType')}>{OCCASIONS.map((o) => <option key={o} value={o}>{t(`occ_${o}`)}</option>)}</select></Field>
        <Field label={t('status')}><select className="input" value={f.status} onChange={set('status')}><option value="confirmed">{t('st_confirmed')}</option><option value="pending">{t('st_pending')}</option></select></Field>
        <Field label={t('notes')}><input className="input" value={f.notes} onChange={set('notes')} /></Field>
        <div className="sm:col-span-2 space-y-3"><Msg>{err}</Msg><button className="btn btn-dark w-full">{t('add')}</button></div>
      </form>
    </Modal>
  );
}
