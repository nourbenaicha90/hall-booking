import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { Badge, Field, Modal, Msg, Spinner } from '../components/Ui';
import { fmtDate } from '../utils';

function NewAdmin({ onClose, onSaved }) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [err, setErr] = useState('');
  const save = async (e) => { e.preventDefault(); try { await api.post('/admin/admins', f); onSaved(); } catch (e2) { setErr(e2.message); } };
  return (
    <Modal title={t('new_admin')} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <Field label={t('name')}><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('email')}><input className="input" type="email" dir="ltr" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label={t('password')}><input className="input" type="password" minLength={8} dir="ltr" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Field label={t('role')}><select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select></Field>
        <Msg>{err}</Msg><button className="btn btn-dark w-full">{t('add')}</button>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const { t, lang } = useI18n();
  const { user: me, isSuper } = useAuth();
  const [users, setUsers] = useState(null);
  const [err, setErr] = useState('');
  const [modal, setModal] = useState(false);
  const load = useCallback(() => api.get('/admin/users').then((d) => setUsers(d.users)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => { setErr(''); try { await fn(); load(); } catch (e) { setErr(e.message); } };
  if (!users) return <Spinner />;
  return (
    <div className="space-y-3">
      {isSuper && <button className="btn btn-gold btn-sm" onClick={() => setModal(true)}>+ {t('new_admin')}</button>}
      <Msg>{err}</Msg>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/10">
        <table className="w-full">
          <thead className="border-b border-ink/10 bg-ivory"><tr>
            <th className="th">{t('name')}</th><th className="th">{t('email')}</th><th className="th">{t('phone')}</th><th className="th">{t('role')}</th><th className="th">{t('bookings_count')}</th><th className="th">{t('joined')}</th><th className="th" />
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink/5">
                <td className="td font-bold">{u.name} {u.suspended && <Badge tone="red">{t('suspended')}</Badge>}</td>
                <td className="td" dir="ltr">{u.email}</td><td className="td" dir="ltr">{u.phone}</td>
                <td className="td"><Badge tone={u.role === 'user' ? 'gray' : 'gold'}>{u.role}</Badge></td>
                <td className="td">{u.bookings_count}</td><td className="td whitespace-nowrap">{fmtDate(u.created_at, lang)}</td>
                <td className="td">
                  {u.id !== me.id && (
                    <div className="flex gap-1">
                      <button className="btn btn-line btn-sm" onClick={() => act(() => api.put(`/admin/users/${u.id}/suspend`, { suspended: !u.suspended }))}>{u.suspended ? t('unsuspend') : t('suspend')}</button>
                      {isSuper && <button className="btn btn-line btn-sm text-wine" onClick={() => window.confirm(t('confirm_delete')) && act(() => api.del(`/admin/users/${u.id}`))}>{t('delete')}</button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <NewAdmin onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}
