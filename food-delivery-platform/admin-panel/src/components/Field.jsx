/** Labelled input helpers for forms. */
export function Field({ label, hint, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-content/50">{hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, value, onChange, type = 'text', ...rest }) {
  return (
    <Field label={label} hint={hint}>
      <input className="input" type={type} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} {...rest} />
    </Field>
  );
}

export function SelectField({ label, hint, value, onChange, options }) {
  return (
    <Field label={label} hint={hint}>
      <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function TextArea({ label, hint, value, onChange, rows = 3 }) {
  return (
    <Field label={label} hint={hint}>
      <textarea className="input" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
