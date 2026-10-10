import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Toggle from '../components/Toggle.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { get, patch, errorKey } from '../services/api';
import { formatDate } from '../utils/format';
import useAsync from '../utils/useAsync';

/** Review moderation: hide abusive reviews (restaurant rating is recalculated server-side). */
export default function Reviews() {
  const { t, language } = useConfig();
  const toast = useToast();
  const [filters, setFilters] = useState({ maxRating: '', visible: '', page: 1 });
  const { data, loading, reload } = useAsync(() => get('/admin/reviews', filters), [filters]);

  const setVisible = async (r, v) => {
    try {
      await patch(`/reviews/${r._id}/visibility`, { isVisible: v });
      toast('review.updated');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('admin.nav.reviews')} subtitle={t('admin.reviewsSubtitle')} />
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input w-auto" value={filters.maxRating} onChange={(e) => setFilters({ ...filters, maxRating: e.target.value, page: 1 })}>
          <option value="">{t('admin.anyRating')}</option>
          {[1, 2, 3].map((n) => <option key={n} value={n}>{t('admin.ratingAtMost', { n })}</option>)}
        </select>
        <select className="input w-auto" value={filters.visible} onChange={(e) => setFilters({ ...filters, visible: e.target.value, page: 1 })}>
          <option value="">{t('common.all')}</option>
          <option value="true">{t('admin.visible')}</option>
          <option value="false">{t('admin.hidden')}</option>
        </select>
      </div>
      <DataTable
        loading={loading}
        rows={data?.items}
        pagination={data?.pagination}
        onPage={(page) => setFilters({ ...filters, page })}
        columns={[
          { key: 'date', label: t('common.date'), render: (r) => formatDate(r.createdAt, language) },
          { key: 'restaurant', label: t('admin.restaurant'), render: (r) => r.restaurant?.name },
          { key: 'user', label: t('admin.customer'), render: (r) => r.user?.name },
          { key: 'rating', label: t('admin.rating'), render: (r) => `★ ${r.rating}${r.deliveryRating ? ` · 🛵 ${r.deliveryRating}` : ''}` },
          { key: 'comment', label: t('review.comment'), render: (r) => <div className="max-w-md text-sm">{r.comment}{r.reply?.text && <div className="mt-1 text-xs text-content/60">↳ {r.reply.text}</div>}</div> },
          { key: 'visible', label: t('admin.visible'), render: (r) => <Toggle checked={r.isVisible} onChange={(v) => setVisible(r, v)} /> },
        ]}
      />
    </div>
  );
}
