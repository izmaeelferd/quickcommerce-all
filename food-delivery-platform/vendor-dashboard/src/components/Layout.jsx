import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import { useToast } from './Toast.jsx';
import { SOCKET_URL, tokens } from '../services/api';

/** Also owns the vendor's realtime socket and broadcasts `vendor:order` DOM events. */
export default function Layout() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ['websocket'], auth: { token: tokens.access } });
    s.on('order:new', (o) => {
      toast('vendor.newOrderAlert');
      window.dispatchEvent(new CustomEvent('vendor:order', { detail: o }));
    });
    s.on('order:status-update', (o) => window.dispatchEvent(new CustomEvent('vendor:order', { detail: o })));
    s.on('delivery:assigned', (o) => window.dispatchEvent(new CustomEvent('vendor:order', { detail: o })));
    return () => s.disconnect();
  }, [toast]);
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
