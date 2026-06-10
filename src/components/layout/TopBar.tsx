import { Bell, Sun, Moon, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../ui';
import { cn } from '../../lib/utils';

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export default function TopBar({ title, subtitle, actions, onMenuClick }: TopBarProps) {
  const { currentUser, darkMode, toggleDarkMode, unreadCount } = useAppStore();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const unread = unreadCount(currentUser.role);

  return (
    <header className="h-14 flex items-center gap-4 px-4 lg:px-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 sticky top-0 z-20">
      {/* Mobile menu button */}
      <button onClick={onMenuClick}
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
        <Menu size={16} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>}
      </div>

      {/* Actions */}
      {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button onClick={toggleDarkMode}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <button onClick={() => navigate('/notifications')}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-[17px] h-[17px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User avatar */}
        <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Avatar name={currentUser.name} initials={currentUser.initials}
            bg={currentUser.avatarBg} color={currentUser.avatarColor} size="sm" />
          <span className="hidden sm:block text-xs font-semibold text-gray-700 dark:text-gray-300">{currentUser.name.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  );
}
