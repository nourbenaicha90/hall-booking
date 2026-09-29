import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Msg, Spinner } from '../components/Ui';
import { fmtDate, hhmm, money } from '../utils';

// الفاتورة صفحة مهيأة للطباعة: "طباعة / حفظ PDF" تعمل مع العربية بدقة عبر المتصفح
export default function Invoice() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get(`/bookings/${id}/invoice`).then(setD).catch((e) => setErr(e.message)); }, [id]);

  if (err) return <div className="mx-auto max-w-lg p-10"><Msg>{err}</Msg></div>;
  if (!d) return <Spinner />;
  const { booking: b, payments, hall } = d;
  const paid = payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="no-print mb-4 flex justify-between">
        <Link to="/account" className="btn btn-line btn-sm">{t('my_account')}</Link>
        <button className="btn btn-dark btn-sm" onClick={() => window.print()}>{t('print_pdf')}</button>
      </div>
      <div className="rounded-2xl bg-white p-8 ring-1 ring-ink/10 print:ring-0">
        <div className="flex items-start justify-between border-b-2 border-gold pb-4">
          <div>
            <h1 className="text-2xl font-black">{hall?.name}</h1>
            <p className="text-sm text-ink/60">{hall?.address}</p>
            <p className="text-sm text-ink/60" dir="ltr">{hall?.phone} {hall?.email && `· ${hall.email}`}</p>
          </div>
          <div className="text-end">
            <p className="text-xl font-black text-gold-deep">{t('invoice')} #{b.id}</p>
            <p className="text-sm text-ink/60">{fmtDate(b.created_at, lang)}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="label">{t('customer')}</dt><dd>{b.customer_name}<br /><span dir="ltr">{b.customer_phone}</span></dd></div>
          <div><dt className="label">{t('section')}</dt><dd>{b.section_name}</dd></div>
          <div><dt className="label">{t('date')}</dt><dd>{fmtDate(b.date, lang)}</dd></div>
          <div><dt className="label">{t('start_time')}</dt><dd dir="ltr" className="text-start">{hhmm(b.start_time)} – {hhmm(b.end_time)}</dd></div>
        </dl>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="border-b border-ink/20"><th className="th">{t('payments_log')}</th><th className="th">{t('method')}</th><th className="th text-end">{t('amount')}</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-ink/10">
                <td className="td">{fmtDate(p.paid_at, lang)} {p.status === 'refunded' && `(${t('refunded')})`}</td>
                <td className="td">{t(`m_${p.method}`)}</td>
                <td className="td text-end">{money(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 ms-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span>{t('total')}</span><b>{money(b.total_amount)}</b></div>
          <div className="flex justify-between"><span>{t('paid')}</span><b>{money(paid)}</b></div>
          <div className="flex justify-between border-t border-ink/20 pt-1 text-base"><span>{t('remaining')}</span><b>{money(Math.max(0, b.total_amount - paid))}</b></div>
        </div>
      </div>
    </div>
  );
}
