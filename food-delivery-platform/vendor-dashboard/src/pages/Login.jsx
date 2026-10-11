import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { errorKey } from '../services/api';

export default function Login() {
  const { user, login, register } = useAuth();
  const { config, t, language } = useConfig();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ identifier: '', password: '', name: '', email: '', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (mode === 'login') await login(f.identifier.trim(), f.password);
      else await register({ name: f.name, email: f.email, phone: f.phone, password: f.password, language });
    } catch (ex) {
      setErr(errorKey(ex));
    } finally {
      setBusy(false);
    }
  };
  const field = (k, labelKey, type = 'text') => (
    <div key={k}>
      <label className="label">{t(labelKey)}</label>
      <input className="input" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required={k !== 'phone' && k !== 'email'} />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          {config?.theme?.appIconUrl && <img src={config.theme.appIconUrl} alt="" className="h-14 w-14 rounded-card object-cover" />}
          <h1 className="text-xl font-extrabold">{config?.branding?.vendorAppName}</h1>
          <p className="text-sm text-content/60">{t(mode === 'login' ? 'auth.loginSubtitle.vendor' : 'vendor.registerSubtitle')}</p>
        </div>
        {mode === 'login' ? [field('identifier', 'auth.emailOrPhone'), field('password', 'auth.password', 'password')] : [field('name', 'auth.name'), field('email', 'auth.email', 'email'), field('phone', 'auth.phone'), field('password', 'auth.password', 'password')]}
        {err && <p className="text-sm text-danger">{t(err)}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? t('common.loading') : t(mode === 'login' ? 'auth.login' : 'auth.signUp')}</button>
        <button type="button" className="btn-ghost w-full" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{t(mode === 'login' ? 'vendor.becomePartner' : 'auth.haveAccount')}</button>
      </form>
    </div>
  );
}
