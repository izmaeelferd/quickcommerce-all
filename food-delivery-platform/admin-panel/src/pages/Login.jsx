import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { errorKey } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const { config, t } = useConfig();
  const nav = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(id.trim(), pw);
      nav('/');
    } catch (ex) {
      setErr(errorKey(ex));
    } finally {
      setBusy(false);
    }
  };

  const logo = config?.theme?.adminLogoUrl || config?.theme?.appIconUrl;
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          {logo && <img src={logo} alt="" className="h-14 w-14 rounded-card object-cover" />}
          <h1 className="text-xl font-extrabold">{config?.branding?.appName}</h1>
          <p className="text-sm text-content/60">{t('admin.loginSubtitle')}</p>
        </div>
        <div>
          <label className="label">{t('auth.emailOrPhone')}</label>
          <input className="input" value={id} onChange={(e) => setId(e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="label">{t('auth.password')}</label>
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        {err && <p className="text-sm text-danger">{t(err)}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? t('common.loading') : t('auth.login')}</button>
      </form>
    </div>
  );
}
