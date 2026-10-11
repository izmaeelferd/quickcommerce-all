export default function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium">{label}</span>}
          {description && <span className="block text-xs text-content/60">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-content/20'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${checked ? 'start-[1.375rem]' : 'start-0.5'}`} />
      </button>
    </label>
  );
}
