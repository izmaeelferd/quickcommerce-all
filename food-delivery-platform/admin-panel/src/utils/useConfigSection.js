import { useCallback, useEffect, useState } from 'react';
import { configApi } from '../services/config';
import { errorKey } from '../services/api';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';

/** Loads one section of the admin config into a local draft and saves it back. */
export default function useConfigSection(section) {
  const { reload } = useConfig();
  const toast = useToast();
  const [draft, setDraft] = useState(null);
  const [original, setOriginal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const cfg = await configApi.adminConfig();
    setDraft(structuredClone(cfg[section]));
    setOriginal(structuredClone(cfg[section]));
    return cfg;
  }, [section]);

  useEffect(() => {
    load().catch((e) => toast(errorKey(e), 'error'));
  }, [load, toast]);

  const set = (path, value) =>
    setDraft((d) => {
      const next = structuredClone(d);
      const keys = path.split('.');
      let cur = next;
      keys.slice(0, -1).forEach((k) => {
        cur[k] = cur[k] ?? {};
        cur = cur[k];
      });
      cur[keys[keys.length - 1]] = value;
      return next;
    });

  const save = async (override) => {
    setSaving(true);
    try {
      const saved = section === 'homeLayout' ? await configApi.updateLayout(override ?? draft) : await configApi.updateSection(SECTION_PATHS[section] || section, override ?? draft);
      setDraft(structuredClone(saved));
      setOriginal(structuredClone(saved));
      toast('config.updated');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  const reset = () => setDraft(structuredClone(original));
  return { draft, setDraft, set, save, saving, dirty, reset };
}

const SECTION_PATHS = { businessRules: 'business', appVersions: 'app-versions' };
