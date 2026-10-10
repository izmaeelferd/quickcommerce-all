import { useConfig } from '../context/ConfigContext.jsx';
import { contrastOn } from '../utils/format';

/**
 * Phone-frame preview of the customer app home screen rendered from a (draft) config.
 * Used by the Theme Editor and Home Layout Builder for instant feedback before saving.
 */
export default function LivePreview({ theme, layout, branding, banners, categories, cuisines }) {
  const { config, t } = useConfig();
  const th = theme || config?.theme || {};
  const br = branding || config?.branding || {};
  const sections = (layout || config?.homeLayout || []).filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const bns = banners || config?.banners || [];
  const cats = categories || config?.categories || [];
  const cus = cuisines || config?.cuisines || [];
  const bg = th.backgroundColor;
  const surface = th.surfaceColor;
  const text = th.textColor;
  const primary = th.primaryColor;
  const card = { borderRadius: th.cardRadius, background: surface };
  const title = (s) => (s.titleKey && t(s.titleKey) !== s.titleKey ? s.title || t(s.titleKey) : s.title);
  const fakeRestaurants = [1, 2, 3];

  const renderSection = (s) => {
    switch (s.type) {
      case 'search':
        return <div style={{ ...card, borderRadius: th.inputRadius }} className="mx-3 mt-3 px-3 py-2 text-[11px] opacity-70">🔍 {title(s) || t('home.searchHint')}</div>;
      case 'banner':
        return (
          <div className="mx-3 mt-3 flex gap-2 overflow-hidden">
            {(bns.length ? bns.slice(0, 2) : [{ _id: 'x' }]).map((b) => (
              <div key={b._id} className="h-24 w-full shrink-0 overflow-hidden" style={{ ...card, background: b.backgroundColor || primary }}>
                {b.imageUrl && <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />}
              </div>
            ))}
          </div>
        );
      case 'categories':
      case 'cuisines': {
        const list = s.type === 'categories' ? cats : cus;
        return (
          <div className="mt-3 px-3">
            {title(s) && <div className="mb-2 text-xs font-bold">{title(s)}</div>}
            <div className={s.layout === 'grid' ? 'grid gap-2' : 'flex gap-2 overflow-hidden'} style={s.layout === 'grid' ? { gridTemplateColumns: `repeat(${Math.min(s.columns || 4, 6)}, minmax(0,1fr))` } : undefined}>
              {(list.length ? list : Array.from({ length: 4 }, (_, i) => ({ _id: i, name: '' }))).slice(0, s.limit || 8).map((c) => (
                <div key={c._id} className="flex w-12 shrink-0 flex-col items-center gap-1">
                  <div className="h-10 w-10 overflow-hidden rounded-full" style={{ background: surface }}>{c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="w-full truncate text-center text-[9px]">{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'offers':
        return (
          <div className="mt-3 px-3">
            {title(s) && <div className="mb-2 text-xs font-bold">{title(s)}</div>}
            <div className="h-14" style={{ ...card, background: `linear-gradient(90deg, ${primary}, ${th.accentColor})` }} />
          </div>
        );
      default:
        return (
          <div className="mt-3 px-3">
            {title(s) && <div className="mb-2 text-xs font-bold">{title(s)}</div>}
            <div className={s.layout === 'list' ? 'space-y-2' : s.layout === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex gap-2 overflow-hidden'}>
              {fakeRestaurants.map((i) => (
                <div key={i} className={s.layout === 'carousel' ? 'w-32 shrink-0' : ''}>
                  <div className="h-16" style={card} />
                  <div className="mt-1 h-2 w-3/4 rounded" style={{ background: text, opacity: 0.6 }} />
                  <div className="mt-1 h-2 w-1/2 rounded" style={{ background: text, opacity: 0.3 }} />
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto w-[300px] rounded-[2.2rem] border-[10px] border-secondary bg-secondary shadow-2xl">
      <div className="h-[580px] overflow-y-auto rounded-[1.6rem]" style={{ background: bg, color: text, fontFamily: th.fontFamily, fontSize: `${12 * (th.appFontScale || 1)}px` }}>
        <div className="flex items-center gap-2 px-3 pt-4">
          {th.appIconUrl ? <img src={th.appIconUrl} alt="" className="h-6 w-6 rounded" /> : <div className="h-6 w-6 rounded" style={{ background: primary }} />}
          <div className="text-sm font-extrabold" style={{ color: primary }}>{br.appName}</div>
        </div>
        {sections.map((s) => <div key={s.id}>{renderSection(s)}</div>)}
        <div className="sticky bottom-0 mt-4 flex justify-around border-t py-2 text-[10px]" style={{ background: bg, borderColor: surface }}>
          <span style={{ color: primary }}>● {t('nav.home')}</span>
          <span>{t('nav.search')}</span>
          <span>{t('nav.orders')}</span>
          <span>{t('nav.profile')}</span>
        </div>
        <div className="p-3">
          <button type="button" className="w-full py-2 text-xs font-bold" style={{ background: primary, color: contrastOn(primary, bg, text), borderRadius: th.buttonRadius }}>{t('cart.view')}</button>
        </div>
      </div>
    </div>
  );
}
