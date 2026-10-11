import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { TrendChart, DonutChart, BarsChart } from '../components/Charts.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { get, SOCKET_URL, tokens } from '../services/api';
import { money, formatDate } from '../utils/format';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

export default function Dashboard() {
  const { t, currency, language } = useConfig();
  const [days, setDays] = useState(30);
  const stats = useAsync(() => get('/admin/stats'), []);
  const revenue = useAsync(() => get('/admin/analytics/revenue', { days }), [days]);

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'], auth: { token: tokens.access } });
    s.on('order:new', () => stats.reload());
    s.on('order:status-update', () => stats.reload());
    return () => s.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = stats.data;
  const r = revenue.data;
  const m = (v) => money(v, currency, language);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.nav.dashboard')}
        subtitle={t('admin.dashboardSubtitle')}
        actions={
          <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[7, 30, 90, 365].map((d) => <option key={d} value={d}>{t('admin.lastNDays', { n: d })}</option>)}
          </select>
        }
      />
      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Icon name="receipt" />} label={t('admin.todayOrders')} value={s.today.orders} />
            <StatCard icon={<Icon name="coins" />} label={t('admin.todayGmv')} value={m(s.today.gmv)} tone="success" />
            <StatCard icon={<Icon name="percent" />} label={t('admin.todayCommission')} value={m(s.today.commission)} tone="accent" />
            <StatCard icon={<Icon name="package" />} label={t('admin.totalOrders')} value={s.counts.orders} />
            <StatCard icon={<Icon name="users" />} label={t('admin.customers')} value={s.counts.users} />
            <StatCard icon={<Icon name="store" />} label={t('admin.activeVendors')} value={s.counts.vendors} hint={t('admin.pendingCount', { n: s.counts.pendingVendors })} tone="warning" />
            <StatCard icon={<Icon name="truck" />} label={t('admin.deliveryPartners')} value={s.counts.partners} hint={t('admin.onlineCount', { n: s.counts.onlinePartners })} />
            <StatCard icon={<Icon name="bank" />} label={t('admin.lifetimeRevenue')} value={m(s.totals.commission)} hint={t('admin.gmvValue', { v: m(s.totals.gmv) })} tone="success" />
          </div>
        </>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <h3 className="mb-4 font-bold">{t('admin.revenueTrend')}</h3>
          {r && <TrendChart data={r.series} xKey="_id" series={[{ key: 'gmv', label: t('admin.gmv') }, { key: 'commission', label: t('admin.commission') }]} />}
        </div>
        <div className="card">
          <h3 className="mb-4 font-bold">{t('admin.paymentMix')}</h3>
          {r && <DonutChart data={r.byPayment.map((p) => ({ name: t(`payment.method.${p._id}`), value: p.count }))} nameKey="name" valueKey="value" />}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-bold">{t('admin.topRestaurants')}</h3>
          {r && <BarsChart data={r.topRestaurants} xKey="name" series={[{ key: 'gmv', label: t('admin.gmv') }]} />}
        </div>
        <div className="card">
          <h3 className="mb-4 font-bold">{t('admin.recentOrders')}</h3>
          <div className="divide-y divide-content/10">
            {s?.recentOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-semibold">{o.orderNumber} · {o.restaurant?.name}</div>
                  <div className="text-xs text-content/50">{formatDate(o.createdAt, language)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{m(o.pricing?.total)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
