const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function ColorPicker({ label, value, onChange }) {
  const valid = HEX.test(value || '');
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-center gap-2">
        <input type="color" value={valid ? value : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-input border border-content/15 bg-transparent p-1" />
        <input className={`input font-mono ${valid ? '' : 'border-danger'}`} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#RRGGBB" />
      </div>
    </div>
  );
}
