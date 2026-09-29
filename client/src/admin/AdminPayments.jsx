import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Badge, Msg, Spinner } from '../components/Ui';
import { fmtDateTime, money } from '../utils';

export default function AdminPayments() {
  const { t, lang } = useI18n();
  const [payments, setPayments] = useState(null);
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get('/admin/payments').then((d) => setPayments(d.payments)).catch((e) => setErr(e.message));
    api.get(`/admin/reports/financial?period=${period}`).then((d) => setReport(d.rows)).catch((e) => setErr(e.message));
  }, [period]);
  useEffect(() => { load(); }, [load]);

  const refund = async (p) => {
    if (!window.confirm(t('confirm_delete'))) return;
    try { await api.post(`/admin/payments/${p.id}/refund`); load(); } catch (e) { setErr(e.message); }
  };
  const total = report.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{t('report')}</h2>
          <div className="flex gap-1">
            {[['day', 'daily'], ['month', 'monthly'], ['year', 'yearly']].map(([k, l]) => (
              <button key={k} onClick={() => setPeriod(k)} className={`btn btn-sm ${period === k ? 'btn-dark' : 'btn-line'}`}>{t(l)}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="h-56" dir="ltr">
            <ResponsiveContainer><BarChart data={[...report].reverse()}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="period" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#C9A45C" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <p className="mt-2 text-end font-black">{t('total')}: {money(total)}</p>
        </div>
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
          <table className="w-full">
            <thead className="border-b border-ink/10 bg-ivory"><tr><th className="th">{t('period')}</th><th className="th">{t('operations')}</th><th className="th">{t('amount')}</th></tr></thead>
            <tbody>{report.map((r) => <tr key={r.period} className="border-b border-ink/5"><td className="td">{r.period}</td><td className="td">{r.count}</td><td className="td font-bold">{money(r.total)}</td></tr>)}
              {!report.length && <tr><td colSpan="3" className="td py-6 text-center text-ink/50">{t('no_results')}</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t('a_payments')}</h2>
        <Msg>{err}</Msg>
        {!payments ? <Spinner /> : (
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
            <table className="w-full">
              <thead className="border-b border-ink/10 bg-ivory"><tr>
                <th className="th">#</th><th className="th">{t('customer')}</th><th className="th">{t('date')}</th><th className="th">{t('method')}</th><th className="th">{t('amount')}</th><th className="th">{t('status')}</th><th className="th" />
              </tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-ink/5">
                    <td className="td">{p.booking_id}</td><td className="td">{p.customer_name}</td>
                    <td className="td whitespace-nowrap">{fmtDateTime(p.paid_at, lang)}</td><td className="td">{t(`m_${p.method}`)}</td>
                    <td className="td font-bold">{money(p.amount)}</td>
                    <td className="td">{p.status === 'refunded' ? <Badge tone="red">{t('refunded')}</Badge> : <Badge tone="green">✓</Badge>}</td>
                    <td className="td">{p.status === 'completed' && <button className="btn btn-line btn-sm" onClick={() => refund(p)}>{t('refund')}</button>}</td>
                  </tr>
                ))}
                {!payments.length && <tr><td colSpan="7" className="td py-6 text-center text-ink/50">{t('no_results')}</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
