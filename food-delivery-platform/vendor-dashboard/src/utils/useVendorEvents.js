import { useEffect } from 'react';

/** Re-runs `fn` whenever the vendor socket reports an order event. */
export default function useVendorEvents(fn) {
  useEffect(() => {
    window.addEventListener('vendor:order', fn);
    return () => window.removeEventListener('vendor:order', fn);
  }, [fn]);
}
