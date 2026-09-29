import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Msg, Spinner } from '../components/Ui';
import { money } from '../utils';

const Stat = ({ label, value }) => (
  <div className="card"><p className="text-sm text-ink/60">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
);

export default function Dashboard() {
  const { t } = useI18n();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/admin/stats').then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <Msg>{err}</Msg>;
  if (!d) return <Spinner />;
  const { totals: s } = d;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={t('a_stat_bookings')} value={s.bookings} />
        <Stat label={t('a_stat_pending')} value={s.pending} />
        <Stat label={t('a_stat_customers')} value={s.customers} />
        <Stat label={t('a_stat_revenue')} value={money(s.revenue)} />
        <Stat label={t('a_stat_month')} value={money(s.revenue_month)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-black">{t('a_chart_bookings')}</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer><BarChart data={d.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#C9A45C" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-3 font-black">{t('a_chart_revenue')}</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer><LineChart data={d.revenue}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="total" stroke="#14100C" strokeWidth={2.5} dot={{ r: 4, fill: '#C9A45C' }} /></LineChart></ResponsiveContainer>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h3 className="mb-3 font-black">{t('a_chart_top')}</h3>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer><BarChart data={d.top} layout="vertical" margin={{ left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={120} /><Tooltip /><Bar dataKey="count" fill="#14100C" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
