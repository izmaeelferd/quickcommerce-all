import { useState } from 'react';

/** Native HTML5 drag-and-drop list. renderItem(item, index, dragHandleProps) */
export default function DragDropList({ items, onChange, renderItem, getKey = (i) => i.id || i._id }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const move = (from, to) => {
    if (from === null || to === null || from === to) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={getKey(item)}
          draggable
          onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
          onDragLeave={() => setOverIndex(null)}
          onDrop={(e) => { e.preventDefault(); move(dragIndex, i); setDragIndex(null); setOverIndex(null); }}
          onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
          className={`rounded-card transition ${dragIndex === i ? 'opacity-40' : ''} ${overIndex === i && dragIndex !== i ? 'ring-2 ring-primary' : ''}`}
        >
          {renderItem(item, i, {
            moveUp: () => move(i, Math.max(0, i - 1)),
            moveDown: () => move(i, Math.min(items.length - 1, i + 1)),
          })}
        </div>
      ))}
    </div>
  );
}
