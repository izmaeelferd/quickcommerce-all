import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';
import { formatDate } from '../utils/format';
import useAsync from '../utils/useAsync';
import Icon from '../components/Icon.jsx';

/** Customer reviews of this restaurant with inline replies. */
export default function Reviews() {
  const { t, language } = useConfig();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, reload } = useAsync(() => vendorApi.reviews(page), [page]);
  const [drafts, setDrafts] = useState({});

  const send = async (r) => {
    try {
      await vendorApi.replyReview(r._id, drafts[r._id]);
      setDrafts({ ...drafts, [r._id]: '' });
      toast('review.replied');
      reload();
    } catch (e) {
      toast(errorKey(e), 'error');
    }
  };

  return (
    <div>
      <PageHeader title={t('restaurant.reviews')} subtitle={t('vendor.reviewsSubtitle')} />
      {data?.items?.length === 0 && <div className="card text-center text-content/60">{t('review.none')}</div>}
      <div className="space-y-4">
        {data?.items?.map((r) => (
          <div key={r._id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.user?.name}</div>
              <div className="text-sm text-content/60">{formatDate(r.createdAt, language)}</div>
            </div>
            <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" filled className={`h-4 w-4 ${n <= r.rating ? 'text-warning' : 'text-content/20'}`} />)}</div>
            {r.comment && <p className="text-sm">{r.comment}</p>}
            {r.images?.length > 0 && <div className="flex gap-2">{r.images.map((u) => <img key={u} src={u} alt="" className="h-16 w-16 rounded-btn object-cover" />)}</div>}
            {r.reply?.text ? (
              <div className="rounded-btn bg-surface p-3 text-sm"><b>{t('vendor.yourReply')}</b> {r.reply.text}</div>
            ) : (
              <div className="flex gap-2">
                <input className="input" placeholder={t('vendor.writeReply')} value={drafts[r._id] || ''} onChange={(e) => setDrafts({ ...drafts, [r._id]: e.target.value })} />
                <button type="button" className="btn-primary" disabled={!drafts[r._id]?.trim()} onClick={() => send(r)}>{t('vendor.reply')}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {data?.pagination?.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.prev')}</button>
          <button type="button" className="btn-outline" disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}>{t('common.next')}</button>
        </div>
      )}
    </div>
  );
}
