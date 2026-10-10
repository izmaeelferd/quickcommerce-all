import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import Toggle from '../components/Toggle.jsx';
import { TextField, TextArea } from '../components/Field.jsx';
import { useConfig } from '../context/ConfigContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { vendorApi } from '../services/vendor';
import { errorKey } from '../services/api';

const EMPTY = { name: '', description: '', phone: '', email: '', address: { fullAddress: '', city: '', state: '', pincode: '' }, cuisines: [], priceForTwo: 0, avgPrepTimeMinutes: 25, isPureVeg: false, offerText: '', logo: '', coverImage: '', licenseNumber: '', gstNumber: '', bankDetails: { accountName: '', accountNumber: '', ifsc: '', upiId: '' } };

/** Restaurant profile; doubles as onboarding when the vendor has no restaurant yet. */
export default function Settings() {
  const { t, config } = useConfig();
  const { restaurant, setRestaurant } = useAuth();
  const toast = useToast();
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (restaurant) setF({ ...EMPTY, ...restaurant, address: { ...EMPTY.address, ...restaurant.address }, bankDetails: { ...EMPTY.bankDetails, ...restaurant.bankDetails }, lat: restaurant.location?.coordinates?.[1], lng: restaurant.location?.coordinates?.[0] });
  }, [restaurant]);

  const locate = () => navigator.geolocation?.getCurrentPosition((p) => setF((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })));

  const save = async () => {
    setBusy(true);
    try {
      const saved = restaurant ? await vendorApi.updateRestaurant(f) : await vendorApi.createRestaurant(f);
      setRestaurant(saved);
      toast('vendor.profileSaved');
    } catch (e) {
      toast(errorKey(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleCuisine = (n) => setF({ ...f, cuisines: f.cuisines.includes(n) ? f.cuisines.filter((x) => x !== n) : [...f.cuisines, n] });

  return (
    <div>
      <PageHeader title={t(restaurant ? 'vendor.restaurantProfile' : 'vendor.setupTitle')} subtitle={t(restaurant ? 'vendor.profileSubtitle' : 'vendor.setupSubtitle')} actions={<button type="button" className="btn-primary" disabled={busy || !f.name} onClick={save}>{t(restaurant ? 'common.save' : 'vendor.submitForApproval')}</button>} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card space-y-4">
          <ImageUpload label={t('vendor.logo')} value={f.logo} onChange={(v) => setF({ ...f, logo: v })} folder="restaurants" aspect="aspect-square" />
          <ImageUpload label={t('vendor.cover')} value={f.coverImage} onChange={(v) => setF({ ...f, coverImage: v })} folder="restaurants" />
        </div>
        <div className="card space-y-4 xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('vendor.restaurantName')} value={f.name} onChange={(v) => setF({ ...f, name: v })} />
            <TextField label={t('vendor.offerText')} value={f.offerText} onChange={(v) => setF({ ...f, offerText: v })} />
            <TextField label={t('auth.phone')} value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
            <TextField label={t('auth.email')} value={f.email} onChange={(v) => setF({ ...f, email: v })} />
            <TextField label={t('vendor.priceForTwo')} type="number" value={f.priceForTwo} onChange={(v) => setF({ ...f, priceForTwo: v })} />
            <TextField label={t('vendor.prepTime')} type="number" value={f.avgPrepTimeMinutes} onChange={(v) => setF({ ...f, avgPrepTimeMinutes: v })} />
          </div>
          <TextArea label={t('vendor.description')} value={f.description} onChange={(v) => setF({ ...f, description: v })} />
          <Toggle label={t('restaurant.pureVeg')} checked={f.isPureVeg} onChange={(v) => setF({ ...f, isPureVeg: v })} />
          <div>
            <div className="label">{t('vendor.cuisines')}</div>
            <div className="flex flex-wrap gap-2">
              {(config?.cuisines || []).map((c) => <button key={c._id} type="button" className={`badge cursor-pointer ${f.cuisines.includes(c.name) ? 'bg-primary text-onprimary' : 'bg-content/10'}`} onClick={() => toggleCuisine(c.name)}>{c.name}</button>)}
            </div>
          </div>
        </div>
        <div className="card space-y-4 xl:col-span-2">
          <h3 className="font-bold">{t('address.title')}</h3>
          <TextField label={t('address.full')} value={f.address.fullAddress} onChange={(v) => setF({ ...f, address: { ...f.address, fullAddress: v } })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label={t('address.city')} value={f.address.city} onChange={(v) => setF({ ...f, address: { ...f.address, city: v } })} />
            <TextField label={t('address.state')} value={f.address.state} onChange={(v) => setF({ ...f, address: { ...f.address, state: v } })} />
            <TextField label={t('address.pincode')} value={f.address.pincode} onChange={(v) => setF({ ...f, address: { ...f.address, pincode: v } })} />
            <TextField label={t('admin.latitude')} type="number" value={f.lat} onChange={(v) => setF({ ...f, lat: v })} step="any" />
            <TextField label={t('admin.longitude')} type="number" value={f.lng} onChange={(v) => setF({ ...f, lng: v })} step="any" />
            <div className="flex items-end"><button type="button" className="btn-outline w-full" onClick={locate}>📍 {t('address.useCurrent')}</button></div>
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="font-bold">{t('vendor.legalBank')}</h3>
          <TextField label={t('vendor.licenseNumber')} value={f.licenseNumber} onChange={(v) => setF({ ...f, licenseNumber: v })} />
          <TextField label={t('vendor.gstNumber')} value={f.gstNumber} onChange={(v) => setF({ ...f, gstNumber: v })} />
          <TextField label={t('bank.accountName')} value={f.bankDetails.accountName} onChange={(v) => setF({ ...f, bankDetails: { ...f.bankDetails, accountName: v } })} />
          <TextField label={t('bank.accountNumber')} value={f.bankDetails.accountNumber} onChange={(v) => setF({ ...f, bankDetails: { ...f.bankDetails, accountNumber: v } })} />
          <TextField label={t('bank.ifsc')} value={f.bankDetails.ifsc} onChange={(v) => setF({ ...f, bankDetails: { ...f.bankDetails, ifsc: v } })} />
          <TextField label={t('bank.upi')} value={f.bankDetails.upiId} onChange={(v) => setF({ ...f, bankDetails: { ...f.bankDetails, upiId: v } })} />
        </div>
      </div>
    </div>
  );
}
