import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Toggle from '../components/Toggle.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';

const blank = (d) => ({ day: d, open: '09:00', close: '23:00', closed: false });

export default function Timings() {
  const { t } = useConfig();
  const { restaurant, setRestaurant } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const existing = restaurant?.timings || [];
    setRows(Array.from({ length: 7 }, (_, d) => existing.find((x) => x.day === d) || blank(d)));
  }, [restaurant]);

  const set = (d, patch) => setRows(rows.map((r) => (r.day === d ? { ...r, ...patch } : r)));
  const save = async () => {
    try {
      setRestaurant(await vendorApi.setTimings(rows));
      toast('vendor.timingsSaved');
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('vendor.timings')} subtitle={t('vendor.timingsSubtitle')} actions={<button type="button" className="btn-primary" onClick={save}>{t('common.save')}</button>} />
      <div className="card max-w-2xl space-y-3">
        {restaurant && (
          <div className="mb-4 flex flex-wrap gap-6 border-b border-content/10 pb-4">
            <Toggle label={t('vendor.restaurantOpen')} checked={restaurant.isOpen} onChange={async (v) => setRestaurant(await vendorApi.setStatus({ isOpen: v }))} />
            <Toggle label={t('vendor.acceptingOrders')} checked={restaurant.acceptingOrders} onChange={async (v) => setRestaurant(await vendorApi.setStatus({ acceptingOrders: v }))} />
          </div>
        )}
        {rows.map((r) => (
          <div key={r.day} className="flex flex-wrap items-center gap-4">
            <div className="w-28 font-semibold">{t(`day.${r.day}`)}</div>
            <Toggle checked={!r.closed} onChange={(v) => set(r.day, { closed: !v })} />
            {r.closed ? (
              <span className="text-sm text-content/60">{t('vendor.closed')}</span>
            ) : (
              <>
                <input className="input w-32" type="time" value={r.open} onChange={(e) => set(r.day, { open: e.target.value })} />
                <span>–</span>
                <input className="input w-32" type="time" value={r.close} onChange={(e) => set(r.day, { close: e.target.value })} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
