import { useEffect, useRef, useState } from 'react';
import { useT } from '../context/ConfigContext.jsx';

const TOOLS = [
  { cmd: 'formatBlock', arg: 'H2', icon: 'H2', key: 'rte.heading' },
  { cmd: 'formatBlock', arg: 'H3', icon: 'H3', key: 'rte.subheading' },
  { cmd: 'formatBlock', arg: 'P', icon: '¶', key: 'rte.paragraph' },
  { cmd: 'bold', icon: 'B', key: 'rte.bold' },
  { cmd: 'italic', icon: 'I', key: 'rte.italic' },
  { cmd: 'underline', icon: 'U', key: 'rte.underline' },
  { cmd: 'insertUnorderedList', icon: '•', key: 'rte.bullets' },
  { cmd: 'insertOrderedList', icon: '1.', key: 'rte.numbered' },
  { cmd: 'createLink', icon: '🔗', key: 'rte.link', prompt: true },
  { cmd: 'removeFormat', icon: '⌫', key: 'rte.clear' },
];

/** Lightweight WYSIWYG (contentEditable) with an HTML source toggle. */
export default function RichTextEditor({ value, onChange, minHeight = 320 }) {
  const t = useT();
  const ref = useRef(null);
  const [source, setSource] = useState(false);

  useEffect(() => {
    if (ref.current && !source && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || '';
  }, [value, source]);

  const exec = (tool) => {
    let arg = tool.arg;
    if (tool.prompt) {
      arg = window.prompt(t('rte.enterUrl'));
      if (!arg) return;
    }
    ref.current?.focus();
    document.execCommand(tool.cmd, false, arg);
    onChange(ref.current.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-input border border-content/15">
      <div className="flex flex-wrap gap-1 border-b border-content/10 bg-surface p-2">
        {TOOLS.map((tool) => (
          <button key={tool.key} type="button" title={t(tool.key)} disabled={source} className="btn-ghost h-8 min-w-8 px-2 py-0 text-sm font-bold" onMouseDown={(e) => { e.preventDefault(); exec(tool); }}>
            {tool.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button type="button" className="btn-ghost h-8 px-2 py-0 text-xs" onClick={() => setSource(!source)}>{t(source ? 'rte.visual' : 'rte.html')}</button>
      </div>
      {source ? (
        <textarea className="w-full bg-background p-3 font-mono text-sm outline-none" style={{ minHeight }} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div ref={ref} className="rte-content bg-background p-4 outline-none" style={{ minHeight }} contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)} />
      )}
    </div>
  );
}
