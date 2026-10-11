import { useEffect, useMemo, useState } from 'react';
import { get } from '../services/api';
import { useT } from '../context/ConfigContext.jsx';
import Icon from './Icon.jsx';

/** Server limit for hand-picked ids per section (utils/layoutSections.js MAX_PICKED). */
export const MAX_PICKED = 50;

const useDebounced = (value, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), ms);
    return () => clearTimeout(h);
  }, [value, ms]);
  return v;
};

/** Restaurant search backed by the admin list endpoint (includes restaurants of every status). */
function useRestaurantSearch(q) {
  const term = useDebounced(q);
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let alive = true;
    get('/admin/restaurants', { q: term, page: 1, limit: 20 })
      .then((d) => alive && setRows(d?.items || []))
      .catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, [term]);
  return rows;
}

/** Ordered list of selected entries with move / remove controls. */
function SelectedList({ ids, labelFor, onChange }) {
  const t = useT();
  const move = (i, d) => {
    const next = [...ids];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  if (!ids.length) return <div className="rounded-input border border-dashed border-content/20 p-3 text-sm text-content/50">{t('admin.noneSelected')}</div>;
  return (
    <ol className="divide-y divide-content/10 rounded-input border border-content/15">
      {ids.map((id, i) => {
        const { title, subtitle, missing } = labelFor(id);
        return (
          <li key={id} className="flex items-center gap-3 px-3 py-2">
            <span className="w-6 text-xs text-content/50">{i + 1}.</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{title}</div>
              <div className={`truncate text-xs ${missing ? 'text-danger' : 'text-content/60'}`}>{missing ? t('admin.notAvailable') : subtitle}</div>
            </div>
            <button type="button" className="btn-ghost px-1.5 py-1" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="arrowUp" className="h-4 w-4" title={t('admin.moveUp')} /></button>
            <button type="button" className="btn-ghost px-1.5 py-1" disabled={i === ids.length - 1} onClick={() => move(i, 1)}><Icon name="arrowDown" className="h-4 w-4" title={t('admin.moveDown')} /></button>
            <button type="button" className="btn-ghost px-1.5 py-1 text-danger" onClick={() => onChange(ids.filter((x) => x !== id))}><Icon name="close" className="h-4 w-4" title={t('common.remove')} /></button>
          </li>
        );
      })}
    </ol>
  );
}

/** Pick and order restaurants for a "Hand-picked restaurants" section. */
export function RestaurantPicker({ value = [], onChange }) {
  const t = useT();
  const [q, setQ] = useState('');
  const results = useRestaurantSearch(q);
  const [known, setKnown] = useState({});

  // Resolve names for ids saved earlier (public endpoint returns approved restaurants only).
  const idsKey = value.join(',');
  useEffect(() => {
    if (!idsKey) return;
    get('/restaurants', { ids: idsKey, limit: MAX_PICKED })
      .then((d) => setKnown((k) => ({ ...k, ...Object.fromEntries((d?.items || []).map((r) => [r._id, r])) })))
      .catch(() => {});
  }, [idsKey]);
  useEffect(() => {
    setKnown((k) => ({ ...k, ...Object.fromEntries(results.map((r) => [r._id, r])) }));
  }, [results]);

  const full = value.length >= MAX_PICKED;
  const labelFor = (id) => {
    const r = known[id];
    return r ? { title: r.name, subtitle: (r.cuisines || []).join(', '), missing: r.status && r.status !== 'approved' } : { title: id, subtitle: '', missing: true };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label mb-0">{t('admin.pickRestaurants')}</span>
        <span className="text-xs text-content/60">{t('admin.selectedCount', { n: value.length, max: MAX_PICKED })}</span>
      </div>
      <SelectedList ids={value} labelFor={labelFor} onChange={onChange} />
      <input className="input" placeholder={t('admin.searchRestaurants')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-56 overflow-y-auto rounded-input border border-content/10">
        {results.map((r) => {
          const picked = value.includes(r._id);
          return (
            <div key={r._id} className="flex items-center gap-3 border-b border-content/5 px-3 py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{r.name}</div>
                <div className="truncate text-xs text-content/50">{(r.cuisines || []).join(', ')}</div>
              </div>
              <button type="button" className="btn-outline px-3 py-1 text-xs" disabled={picked || full} onClick={() => onChange([...value, r._id])}>
                {picked ? t('common.added') : full ? t('admin.limitReached') : t('common.add')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Pick and order dishes (from any restaurant) for a "Hand-picked dishes" section. */
export function DishPicker({ value = [], onChange }) {
  const t = useT();
  const [q, setQ] = useState('');
  const restaurants = useRestaurantSearch(q);
  const [restaurantId, setRestaurantId] = useState('');
  const [menu, setMenu] = useState([]);
  const [known, setKnown] = useState({});

  const idsKey = value.join(',');
  useEffect(() => {
    if (!idsKey) return;
    get('/menu/public/items', { ids: idsKey })
      .then((list) => setKnown((k) => ({ ...k, ...Object.fromEntries((list || []).map((i) => [i._id, { name: i.name, restaurant: i.restaurant?.name || '' }])) })))
      .catch(() => {});
  }, [idsKey]);

  useEffect(() => {
    if (!restaurantId) { setMenu([]); return; }
    let alive = true;
    get(`/restaurants/${restaurantId}/menu`)
      .then((d) => alive && setMenu((d?.categories || []).flatMap((c) => (c.items || []).map((i) => ({ ...i, categoryName: c.name })))))
      .catch(() => alive && setMenu([]));
    return () => { alive = false; };
  }, [restaurantId]);

  const restaurantName = useMemo(() => restaurants.find((r) => r._id === restaurantId)?.name || '', [restaurants, restaurantId]);
  const full = value.length >= MAX_PICKED;
  const labelFor = (id) => {
    const i = known[id];
    return i ? { title: i.name, subtitle: i.restaurant, missing: false } : { title: id, subtitle: '', missing: true };
  };
  const add = (item) => {
    setKnown((k) => ({ ...k, [item._id]: { name: item.name, restaurant: restaurantName } }));
    onChange([...value, item._id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label mb-0">{t('admin.pickDishes')}</span>
        <span className="text-xs text-content/60">{t('admin.selectedCount', { n: value.length, max: MAX_PICKED })}</span>
      </div>
      <SelectedList ids={value} labelFor={labelFor} onChange={onChange} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder={t('admin.searchRestaurants')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)}>
          <option value="">{t('admin.chooseRestaurant')}</option>
          {restaurants.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
      </div>
      {restaurantId && (
        <div className="max-h-64 overflow-y-auto rounded-input border border-content/10">
          {menu.map((i) => {
            const picked = value.includes(i._id);
            return (
              <div key={i._id} className="flex items-center gap-3 border-b border-content/5 px-3 py-2 last:border-0">
                {i.image ? <img src={i.image} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-surface" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{i.name}</div>
                  <div className="truncate text-xs text-content/50">{i.categoryName}{i.isAvailable === false ? ` · ${t('admin.notAvailable')}` : ''}</div>
                </div>
                <button type="button" className="btn-outline px-3 py-1 text-xs" disabled={picked || full} onClick={() => add(i)}>
                  {picked ? t('common.added') : full ? t('admin.limitReached') : t('common.add')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
