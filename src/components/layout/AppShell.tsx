import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ToastContainer } from '../ui';
import { cn } from '../../lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { toasts, dismissToast, sidebarCollapsed } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative z-10 w-[240px] h-full animate-fade-in">
            <Sidebar mobile onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={cn('flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200')}>
        {/* Inject drawer opener into children via context would be cleaner,
            but for simplicity we clone with extra prop */}
        <div className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {/* Pass setDrawerOpen down via a wrapper — use a data attribute trick */}
          <div data-open-drawer="true" onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-menu-trigger]')) setDrawerOpen(true);
          }}>
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
