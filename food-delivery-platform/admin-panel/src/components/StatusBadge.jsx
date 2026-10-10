import { useT } from '../context/ConfigContext.jsx';

const TONES = {
  approved: 'success', delivered: 'success', paid: 'success', success: 'success', active: 'success',
  pending: 'warning', placed: 'warning', preparing: 'warning', accepted: 'primary', ready: 'primary', picked: 'primary',
  suspended: 'danger', rejected: 'danger', cancelled: 'danger', failed: 'danger', banned: 'danger', refunded: 'accent', partially_refunded: 'accent',
};
const CLASSES = { success: 'bg-success/15 text-success', warning: 'bg-warning/20 text-warning', danger: 'bg-danger/15 text-danger', primary: 'bg-primary/15 text-primary', accent: 'bg-accent/20 text-accent' };

export default function StatusBadge({ status, prefix = 'status' }) {
  const t = useT();
  return <span className={`badge ${CLASSES[TONES[status] || 'primary']}`}>{t(`${prefix}.${status}`)}</span>;
}
