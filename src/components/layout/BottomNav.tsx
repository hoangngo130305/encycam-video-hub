import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, Upload, Bell, Users } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

function getBottomItems(role: Role) {
  switch (role) {
    case 'btv': return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
      { to: '/videos', icon: Video, label: 'Videos' },
      { to: '/upload', icon: Upload, label: 'Upload' },
      { to: '/notifications', icon: Bell, label: 'Thông báo' },
    ];
    case 'reviewer': return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Queue' },
      { to: '/videos', icon: Video, label: 'Videos' },
      { to: '/notifications', icon: Bell, label: 'Thông báo' },
    ];
    case 'final': return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Duyệt' },
      { to: '/videos', icon: Video, label: 'Videos' },
      { to: '/notifications', icon: Bell, label: 'Thông báo' },
    ];
    case 'admin': return [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
      { to: '/videos', icon: Video, label: 'Videos' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/notifications', icon: Bell, label: 'Alerts' },
    ];
    default: return [];
  }
}

export default function BottomNav() {
  const { currentUser, unreadCount } = useAppStore();
  if (!currentUser) return null;

  const items = getBottomItems(currentUser.role);
  const unread = unreadCount(currentUser.role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex lg:hidden safe-area-pb">
      {items.map(item => (
        <NavLink key={item.to} to={item.to}
          className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-[10px] font-medium transition-colors',
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500',
          )}>
          {({ isActive }) => (
            <>
              <div className={cn('relative w-6 h-6 flex items-center justify-center')}>
                <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                {item.label === 'Thông báo' && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
