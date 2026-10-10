import PageHeader from '../components/PageHeader.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField } from '../components/Field.jsx';
import { useT } from '../context/ConfigContext.jsx';
import useConfigSection from '../utils/useConfigSection';
import SaveBar from './_SaveBar.jsx';

function Card({ title, children }) {
  return (
    <div className="card">
      <h3 className="mb-4 font-bold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function BusinessRules() {
  const t = useT();
  const { draft, set, save, saving, dirty, reset } = useConfigSection('businessRules');
  if (!draft) return <div className="text-content/60">{t('common.loading')}</div>;
  const num = (path, opts = {}) => {
    const v = path.split('.').reduce((o, k) => (o ? o[k] : undefined), draft);
    return <TextField key={path} type="number" label={t(`rules.${path}`)} hint={opts.hint ? t(`rules.${path}Hint`) : undefined} value={v} onChange={(x) => set(path, x)} step="any" />;
  };
  const slots = draft.deliverySlots || [];
  const setSlot = (i, patch) => set('deliverySlots', slots.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div>
      <PageHeader title={t('admin.nav.business')} subtitle={t('admin.businessSubtitle')} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={t('rules.group.currency')}>
          <TextField label={t('rules.currencySymbol')} value={draft.currencySymbol} onChange={(v) => set('currencySymbol', v)} />
          <TextField label={t('rules.currencyCode')} hint={t('rules.currencyCodeHint')} value={draft.currencyCode} onChange={(v) => set('currencyCode', v.toUpperCase())} />
          {num('commissionPercent', { hint: true })}
          {num('minOrderValue')}
          {num('minPayoutAmount')}
          {num('codMaxAmount', { hint: true })}
        </Card>
        <Card title={t('rules.group.deliveryFee')}>
          {num('deliveryFee.base')}
          {num('deliveryFee.perKm')}
          {num('deliveryFee.baseKm', { hint: true })}
          {num('deliveryFee.freeAbove', { hint: true })}
          {num('radiusKm')}
          {num('packagingFee')}
          {num('platformFee')}
        </Card>
        <Card title={t('rules.group.tax')}>
          {num('taxPercent')}
          <TextField label={t('rules.taxLabel')} value={draft.taxLabel} onChange={(v) => set('taxLabel', v)} />
        </Card>
        <Card title={t('rules.group.surge')}>
          <div className="sm:col-span-2"><Toggle label={t('rules.surgePricing.enabled')} checked={!!draft.surgePricing?.enabled} onChange={(v) => set('surgePricing.enabled', v)} /></div>
          {num('surgePricing.multiplier')}
          <TextField label={t('rules.surgePricing.reason')} value={draft.surgePricing?.reason} onChange={(v) => set('surgePricing.reason', v)} />
        </Card>
        <Card title={t('rules.group.tips')}>
          {num('maxTipPercent')}
          <TextField label={t('rules.tipPresets')} hint={t('rules.tipPresetsHint')} value={(draft.tipPresets || []).join(', ')} onChange={(v) => set('tipPresets', v.split(',').map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x) && x > 0))} />
          {num('deliveryPartnerPayout.base')}
          {num('deliveryPartnerPayout.perKm')}
          {num('deliveryPartnerPayout.tipSharePercent')}
        </Card>
        <Card title={t('rules.group.cancellation')}>
          {num('cancellationWindowMinutes')}
          {num('cancellationPenaltyPercent')}
          {num('vendorAcceptTimeoutMinutes')}
          <div className="flex items-end"><Toggle label={t('rules.autoAssignDelivery')} checked={!!draft.autoAssignDelivery} onChange={(v) => set('autoAssignDelivery', v)} /></div>
        </Card>
        <Card title={t('rules.group.wallet')}>
          {num('referralBonus')}
          {num('refereeBonus')}
          {num('walletMaxUsePercent')}
        </Card>
        <Card title={t('rules.group.login')}>
          <Toggle label={t('rules.otpLogin')} checked={!!draft.otpLogin} onChange={(v) => set('otpLogin', v)} />
          {num('otpLength')}
        </Card>
        <Card title={t('rules.group.payments')}>
          {['card', 'upi', 'wallet', 'cod', 'netbanking'].map((m) => (
            <Toggle key={m} label={t(`payment.method.${m}`)} checked={!!draft.paymentMethods?.[m]} onChange={(v) => set(`paymentMethods.${m}`, v)} />
          ))}
        </Card>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">{t('rules.group.slots')}</h3>
            <button type="button" className="btn-outline px-3 py-1 text-sm" onClick={() => set('deliverySlots', [...slots, { id: `slot_${Date.now()}`, label: '', start: '12:00', end: '14:00', enabled: true }])}>+ {t('rules.addSlot')}</button>
          </div>
          <div className="space-y-3">
            {slots.map((s, i) => (
              <div key={s.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2">
                <input className="input" placeholder={t('rules.slotLabel')} value={s.label} onChange={(e) => setSlot(i, { label: e.target.value })} />
                <input className="input w-28" type="time" value={s.start} onChange={(e) => setSlot(i, { start: e.target.value })} />
                <input className="input w-28" type="time" value={s.end} onChange={(e) => setSlot(i, { end: e.target.value })} />
                <Toggle checked={s.enabled} onChange={(v) => setSlot(i, { enabled: v })} />
                <button type="button" className="btn-ghost px-2 text-danger" onClick={() => set('deliverySlots', slots.filter((_, j) => j !== i))}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={reset} />
    </div>
  );
}
