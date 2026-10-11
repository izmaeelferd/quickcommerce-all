import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { configApi } from '../services/config';
import { SOCKET_URL } from '../services/api';
import { hexToRgbTriplet } from '../utils/format';

const ConfigContext = createContext(null);
const LANG_KEY = 'admin_language';
const DARK_KEY = 'admin_dark_mode';

const luminance = (triplet) => {
  if (!triplet) return 0;
  const [r, g, b] = triplet.split(' ').map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** Pushes theme values into CSS variables consumed by Tailwind. */
export function applyTheme(theme = {}) {
  const root = document.documentElement;
  const map = {
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor,
    surface: theme.surfaceColor,
    background: theme.backgroundColor,
    text: theme.textColor,
    success: theme.successColor,
    warning: theme.warningColor,
    error: theme.errorColor,
    veg: theme.vegColor,
    nonveg: theme.nonVegColor,
  };
  const dark = root.classList.contains('dark');
  Object.entries(map).forEach(([k, hex]) => {
    if (dark && ['surface', 'background', 'text'].includes(k)) {
      root.style.removeProperty(`--color-${k}`);
      return;
    }
    const t = hexToRgbTriplet(hex);
    if (t) root.style.setProperty(`--color-${k}`, t);
  });
  const p = hexToRgbTriplet(theme.primaryColor);
  if (p) root.style.setProperty('--color-on-primary', luminance(p) > 0.6 ? '20 20 20' : '255 255 255');
  if (theme.cardRadius != null) root.style.setProperty('--radius-card', `${theme.cardRadius}px`);
  if (theme.buttonRadius != null) root.style.setProperty('--radius-button', `${theme.buttonRadius}px`);
  if (theme.inputRadius != null) root.style.setProperty('--radius-input', `${theme.inputRadius}px`);
  if (theme.fontFamily) {
    root.style.setProperty('--font-app', `'${theme.fontFamily}'`);
    const id = 'app-font-link';
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@400;500;600;700;800&display=swap`;
  }
  if (theme.faviconUrl || theme.appIconUrl) document.getElementById('app-favicon')?.setAttribute('href', theme.faviconUrl || theme.appIconUrl);
  if (theme.appFontScale) root.style.fontSize = `${16 * theme.appFontScale}px`;
}

const humanize = (key) => {
  const last = key.split('.').pop() || key;
  const s = last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [strings, setStrings] = useState({});
  const [rtl, setRtl] = useState(false);
  const [language, setLanguageState] = useState(localStorage.getItem(LANG_KEY) || '');
  const [dark, setDark] = useState(localStorage.getItem(DARK_KEY) === 'true');
  const [error, setError] = useState(null);

  const loadTranslations = useCallback(async (lang) => {
    const tr = await configApi.translations(lang);
    setStrings(tr.strings || {});
    setRtl(!!tr.isRTL);
    document.documentElement.lang = tr.code || lang;
  }, []);

  const reload = useCallback(async () => {
    try {
      const cfg = await configApi.publicConfig();
      setConfig(cfg);
      const lang = language && cfg.languages.includes(language) ? language : cfg.defaultLanguage;
      if (!language) setDark(localStorage.getItem(DARK_KEY) ? localStorage.getItem(DARK_KEY) === 'true' : !!cfg.theme.darkModeDefault);
      setLanguageState(lang);
      await loadTranslations(lang);
      setError(null);
      return cfg;
    } catch (e) {
      setError(e);
      return null;
    }
  }, [language, loadTranslations]);

  useEffect(() => {
    reload();
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('config:updated', () => reload());
    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(DARK_KEY, String(dark));
    if (config) applyTheme(config.theme);
  }, [dark, config]);

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [rtl]);

  useEffect(() => {
    if (config) document.title = `${config.branding.appName} · ${strings['admin.title'] || humanize('admin.title')}`;
  }, [config, strings]);

  const t = useCallback(
    (key, vars = {}) => {
      const raw = strings[key] || humanize(key);
      return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
    },
    [strings]
  );

  const setLanguage = useCallback(
    async (lang) => {
      localStorage.setItem(LANG_KEY, lang);
      setLanguageState(lang);
      await loadTranslations(lang);
    },
    [loadTranslations]
  );

  const value = useMemo(
    () => ({
      config,
      error,
      reload,
      t,
      language,
      setLanguage,
      dark,
      setDark,
      currency: config?.businessRules?.currencySymbol || '',
      feature: (k) => !!config?.features?.[k],
    }),
    [config, error, reload, t, language, setLanguage, dark]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);
export const useT = () => useContext(ConfigContext).t;
