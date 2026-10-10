export default function StatCard({ label, value, icon, hint, tone = 'primary' }) {
  const tones = { primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-danger/10 text-danger', accent: 'bg-accent/15 text-accent' };
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-card text-xl ${tones[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold">{value}</div>
        <div className="truncate text-sm text-content/60">{label}</div>
        {hint && <div className="text-xs text-content/40">{hint}</div>}
      </div>
    </div>
  );
}
