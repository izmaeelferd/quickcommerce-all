import { createContext, useCallback, useContext, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const { t } = useConfig();
  const push = useCallback((key, type = 'success', vars = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, key, type, vars }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {items.map((i) => (
          <div key={i.id} className={`rounded-card px-4 py-3 text-sm shadow-lg text-onprimary ${i.type === 'error' ? 'bg-danger' : 'bg-success'}`}>
            {t(i.key, i.vars)}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
