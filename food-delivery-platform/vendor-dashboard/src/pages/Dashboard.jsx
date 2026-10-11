import { useCallback, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import { BarsChart } from '../components/Charts.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { vendorApi } from '../services/vendor';
import { money } from '../utils/format';
import useAsync from '../utils/useAsync';
import useVendorEvents from '../utils/useVendorEvents';
import Icon from '../components/Icon.jsx';

export default function Dashboard() {
  const { t, currency, language } = useConfig();
  const { restaurant } = useAuth();
  const [days, setDays] = useState(7);
  const { data: s, reload } = useAsync(() => vendorApi.stats(days), [days]);
  useVendorEvents(useCallback(() => reload(), [reload]));
  const m = (v) => money(v, currency, language);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('vendor.nav.dashboard')}
        subtitle={restaurant?.name}
        actions={<select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90].map((d) => <option key={d} value={d}>{t('admin.lastNDays', { n: d })}</option>)}</select>}
      />
      {restaurant && restaurant.status !== 'approved' && (
        <div className="card border-warning bg-warning/10">
          <div className="font-bold">{t(`vendor.status.${restaurant.status}`)}</div>
          <div className="text-sm">{t(`vendor.statusHint.${restaurant.status}`)}</div>
        </div>
      )}
      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Icon name="receipt" />} label={t('vendor.todayOrders')} value={s.today.orders} />
            <StatCard icon={<Icon name="coins" />} label={t('vendor.todayEarnings')} value={m(s.today.revenue)} tone="success" />
            <StatCard icon="⏳" label={t('vendor.pending')} value={s.pendingOrders} tone="warning" />
            <StatCard icon={<Icon name="percent" />} label={t('vendor.commission')} value={`${s.commissionPercent}%`} tone="accent" />
            <StatCard icon={<Icon name="package" />} label={t('vendor.totalOrders')} value={s.totals.orders} />
            <StatCard icon={<Icon name="bank" />} label={t('vendor.totalEarnings')} value={m(s.totals.earnings)} tone="success" />
            <StatCard icon={<Icon name="chart" />} label={t('vendor.grossSales')} value={m(s.totals.gross)} />
            <StatCard icon={<Icon name="star" />} label={t('admin.rating')} value={s.restaurant.rating?.toFixed?.(1) ?? '0'} tone="accent" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="card xl:col-span-2">
              <h3 className="mb-4 font-bold">{t('vendor.earningsTrend')}</h3>
              <BarsChart data={s.daily} xKey="_id" series={[{ key: 'earnings', label: t('vendor.earnings') }, { key: 'orders', label: t('vendor.nav.orders') }]} />
            </div>
            <div className="card">
              <h3 className="mb-4 font-bold">{t('vendor.topItems')}</h3>
              {s.topItems.length === 0 && <p className="text-sm text-content/60">{t('vendor.noData')}</p>}
              {s.topItems.map((i) => (
                <div key={i._id} className="flex justify-between border-b border-content/10 py-2 text-sm">
                  <span>{i._id}</span>
                  <span className="text-content/70">{t('vendor.soldCount', { count: i.qty })} · {m(i.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
