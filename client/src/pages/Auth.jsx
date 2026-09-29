import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { api } from '../api';
import { Field, Msg } from '../components/Ui';

function Shell({ title, children }) {
  return (
    <div className="pattern-gold flex min-h-[70vh] items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-ivory p-8 shadow-2xl">
        <h1 className="mb-6 text-2xl font-black">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Login({ admin = false }) {
  const { t } = useI18n();
  const { login, adminLogin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const u = await (admin ? adminLogin : login)(f.email, f.password);
      nav(loc.state?.from || (['admin', 'superadmin'].includes(u.role) && admin ? '/admin' : '/account'), { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <Shell title={admin ? t('a_login_title') : t('login')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('email')}><input className="input" type="email" required autoComplete="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label={t('password')}><input className="input" type="password" required autoComplete="current-password" dir="ltr" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <Msg>{err}</Msg>
        <button className="btn btn-dark w-full" disabled={busy}>{busy ? t('signing_in') : t('login')}</button>
      </form>
      {!admin && (
        <div className="mt-5 space-y-1 text-center text-sm">
          <p><Link className="font-bold text-gold-deep" to="/forgot-password">{t('forgot_password')}</Link></p>
          <p>{t('no_account')} <Link className="font-bold text-gold-deep" to="/register" state={loc.state}>{t('register')}</Link></p>
        </div>
      )}
    </Shell>
  );
}

export function Register() {
  const { t } = useI18n();
  const { register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await register(f); nav(loc.state?.from || '/account', { replace: true }); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <Shell title={t('register')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('full_name')}><input className="input" required minLength={2} autoComplete="name" value={f.name} onChange={set('name')} /></Field>
        <Field label={t('email')}><input className="input" type="email" required autoComplete="email" dir="ltr" value={f.email} onChange={set('email')} /></Field>
        <Field label={t('phone')}><input className="input" type="tel" required autoComplete="tel" dir="ltr" value={f.phone} onChange={set('phone')} /></Field>
        <Field label={t('password')}><input className="input" type="password" required minLength={8} autoComplete="new-password" dir="ltr" value={f.password} onChange={set('password')} /></Field>
        <Msg>{err}</Msg>
        <button className="btn btn-dark w-full" disabled={busy}>{t('create_account')}</button>
      </form>
      <p className="mt-5 text-center text-sm">{t('have_account')} <Link className="font-bold text-gold-deep" to="/login" state={loc.state}>{t('login')}</Link></p>
    </Shell>
  );
}

export function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try { setMsg((await api.post('/auth/forgot-password', { email })).message); } catch (e2) { setErr(e2.message); }
  };
  return (
    <Shell title={t('reset_title')}>
      <p className="mb-4 text-sm text-ink/70">{t('reset_hint')}</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('email')}><input className="input" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Msg>{err}</Msg><Msg type="ok">{msg}</Msg>
        <button className="btn btn-dark w-full">{t('send_reset')}</button>
      </form>
    </Shell>
  );
}

export function ResetPassword() {
  const { t } = useI18n();
  const { token } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { setMsg((await api.post('/auth/reset-password', { token, password })).message); setTimeout(() => nav('/login'), 1800); }
    catch (e2) { setErr(e2.message); }
  };
  return (
    <Shell title={t('reset_password')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('new_password')}><input className="input" type="password" required minLength={8} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Msg>{err}</Msg><Msg type="ok">{msg}</Msg>
        <button className="btn btn-dark w-full">{t('reset_password')}</button>
      </form>
    </Shell>
  );
}
