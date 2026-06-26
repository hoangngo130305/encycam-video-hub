import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Video, Upload, Bell, Users, FileText, AlertTriangle,
  ListChecks, Gavel, ChevronLeft, ChevronRight, LogOut, Tag, X,
  FolderOpen, UserCheck,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Avatar, RoleBadge } from '../ui';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

function getNavItems(allRoles: Role[], unread: number): NavItem[] {
  const has = (...roles: Role[]) => roles.some(r => allRoles.includes(r));

  // Sale Manager nav
  if (has('sale_manager') && !has('admin')) {
    return [
      { to: '/dashboard',              icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/sale-videos',            icon: Video,           label: 'Video Sale' },
      { to: '/sale-manager/projects',  icon: FolderOpen,      label: 'Projects' },
      { to: '/sale-manager/users',     icon: UserCheck,       label: 'Tài khoản Sale' },
      { to: '/notifications',          icon: Bell,            label: 'Thông báo', badge: unread },
    ];
  }

  // Sale nav
  if (has('sale') && !has('admin')) {
    return [
      { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/sale-videos', icon: Video,           label: 'Video của tôi' },
      { to: '/sale/upload', icon: Upload,          label: 'Upload video' },
      { to: '/notifications', icon: Bell,          label: 'Thông báo', badge: unread },
    ];
  }

  const dashboardLabels: Partial<Record<Role, { icon: React.ElementType; label: string }>> = {
    admin:    { icon: LayoutDashboard, label: 'Tổng quan' },
    final:    { icon: Gavel,           label: 'Chờ duyệt cuối' },
    reviewer: { icon: ListChecks,      label: 'Hàng chờ review' },
    btv:      { icon: LayoutDashboard, label: 'Dashboard' },
  };
  const priority: Role[] = ['admin', 'final', 'reviewer', 'btv'];
  const primaryRole = priority.find(r => allRoles.includes(r)) ?? 'btv';
  const dash = dashboardLabels[primaryRole]!;

  const items: NavItem[] = [{ to: '/dashboard', icon: dash.icon, label: dash.label }];

  if (has('reviewer', 'final', 'admin')) {
    items.push({ to: '/videos', icon: Video, label: 'Tất cả video' });
  } else {
    items.push({ to: '/videos', icon: Video, label: 'Video của tôi' });
  }

  if (has('btv')) {
    items.push({ to: '/upload', icon: Upload, label: 'Upload video' });
  }

  if (has('admin')) {
    items.push(
      { to: '/sale-videos',           icon: Video,         label: 'Video Sale' },
      { to: '/sale-manager/projects', icon: FolderOpen,    label: 'Sale Projects' },
      { to: '/sale-manager/users',    icon: UserCheck,     label: 'Sale accounts' },
      { to: '/admin/users',           icon: Users,         label: 'Quản lý user' },
      { to: '/admin/categories',      icon: Tag,           label: 'Danh mục' },
      { to: '/admin/audit',           icon: FileText,      label: 'Audit log' },
      { to: '/notifications',         icon: AlertTriangle, label: 'Cảnh báo', badge: unread },
    );
  } else {
    items.push({ to: '/notifications', icon: Bell, label: 'Thông báo', badge: unread });
  }

  return items;
}

const ROLE_ACCENT: Record<Role, string> = {
  btv:          'bg-blue-600',
  reviewer:     'bg-violet-600',
  final:        'bg-orange-500',
  admin:        'bg-violet-700',
  sale_manager: 'bg-yellow-500',
  sale:         'bg-pink-500',
};

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobile, onClose }: SidebarProps) {
  const { currentUser, sidebarCollapsed, toggleSidebar, logout, unreadCount } = useAppStore();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const allRoles: Role[] = (currentUser.allRoles?.length ? currentUser.allRoles : [currentUser.role]) as Role[];
  const unread = unreadCount(currentUser.role);
  const navItems = getNavItems(allRoles, unread);
  const collapsed = !mobile && sidebarCollapsed;

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-200',
      collapsed ? 'w-[60px]' : 'w-[240px]',
    )}>
      {/* Header */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800', collapsed && 'px-3 justify-center')}>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0', ROLE_ACCENT[currentUser.role])}>
          E
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0">
              <div className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">EncyCam</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">Video Hub</div>
            </div>
            {mobile && (
              <button onClick={onClose} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-3 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600">Menu</p>
        )}
        <div className="flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 rounded-lg font-medium text-sm transition-all duration-100 relative',
                collapsed ? 'w-9 h-9 justify-center mx-auto' : 'px-3 py-2',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
              )}>
              {({ isActive }) => (
                <>
                  <item.icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge && item.badge > 0 ? (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {item.badge}
                    </span>
                  ) : null}
                  {collapsed && item.badge && item.badge > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-gray-100 dark:border-gray-800 p-3', collapsed && 'px-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group">
            <Avatar name={currentUser.name} initials={currentUser.initials}
              bg={currentUser.avatarBg} color={currentUser.avatarColor} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{currentUser.name}</div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {allRoles.map(r => <RoleBadge key={r} role={r} />)}
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/'); }}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 items-center">
            <Avatar name={currentUser.name} initials={currentUser.initials}
              bg={currentUser.avatarBg} color={currentUser.avatarColor} size="sm" />
          </div>
        )}

        {!mobile && (
          <button onClick={toggleSidebar}
            className={cn('mt-2 w-full flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors text-xs gap-1',
              collapsed && 'w-9 h-9 mx-auto')}>
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={12} /><span>Thu gọn</span></>}
          </button>
        )}
      </div>
    </aside>
  );
}
