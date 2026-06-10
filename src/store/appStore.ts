import { create } from 'zustand';
import type { User, Video, Comment, Notification, AuditEntry, Toast, ToastType } from '../types';
import { USERS, VIDEOS, COMMENTS, NOTIFICATIONS, AUDIT_LOG } from '../data/mockData';

interface AppState {
  // Auth
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Videos
  videos: Video[];
  getVideoById: (id: number) => Video | undefined;
  updateVideoStatus: (id: number, status: Video['status']) => void;
  addVideo: (video: Video) => void;
  bumpVideoVersion: (id: number) => void;

  // Comments
  comments: Record<number, Comment[]>;
  addComment: (videoId: number, comment: Comment) => void;
  resolveComment: (videoId: number, commentId: number) => void;

  // Notifications
  notifications: Record<string, Notification[]>;
  markAllRead: (role: string) => void;
  markOneRead: (role: string, id: number) => void;
  unreadCount: (role: string) => number;

  // Users (admin)
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: number, updates: Partial<User>) => void;
  toggleLock: (id: number) => void;

  // Audit log
  auditLog: AuditEntry[];
  addAudit: (entry: Omit<AuditEntry, 'id'>) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),

  darkMode: false,
  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    document.documentElement.classList.toggle('dark', next);
  },

  sidebarCollapsed: false,
  sidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  videos: VIDEOS,
  getVideoById: (id) => get().videos.find(v => v.id === id),
  updateVideoStatus: (id, status) => set(s => ({
    videos: s.videos.map(v => v.id === id ? { ...v, status, updatedAt: 'Vừa xong' } : v),
  })),
  addVideo: (video) => set(s => ({ videos: [video, ...s.videos] })),
  bumpVideoVersion: (id) => set(s => ({
    videos: s.videos.map(v => {
      if (v.id !== id) return v;
      const newVer = v.currentVersion + 1;
      return {
        ...v,
        currentVersion: newVer,
        status: 'reviewing' as const,
        updatedAt: 'Vừa xong',
        versions: [...v.versions, {
          number: newVer,
          uploadedAt: new Date().toLocaleString('vi-VN'),
          uploadedBy: s.currentUser?.name ?? '',
          fileSize: '—',
          duration: '—',
        }],
      };
    }),
  })),

  comments: COMMENTS,
  addComment: (videoId, comment) => set(s => ({
    comments: {
      ...s.comments,
      [videoId]: [...(s.comments[videoId] ?? []), comment],
    },
  })),
  resolveComment: (videoId, commentId) => set(s => ({
    comments: {
      ...s.comments,
      [videoId]: (s.comments[videoId] ?? []).map(c =>
        c.id === commentId ? { ...c, resolved: true } : c,
      ),
    },
  })),

  notifications: NOTIFICATIONS,
  markAllRead: (role) => set(s => ({
    notifications: {
      ...s.notifications,
      [role]: (s.notifications[role] ?? []).map(n => ({ ...n, read: true })),
    },
  })),
  markOneRead: (role, id) => set(s => ({
    notifications: {
      ...s.notifications,
      [role]: (s.notifications[role] ?? []).map(n => n.id === id ? { ...n, read: true } : n),
    },
  })),
  unreadCount: (role) => (get().notifications[role] ?? []).filter(n => !n.read).length,

  users: USERS,
  addUser: (user) => set(s => ({ users: [...s.users, user] })),
  updateUser: (id, updates) => set(s => ({
    users: s.users.map(u => u.id === id ? { ...u, ...updates } : u),
  })),
  toggleLock: (id) => set(s => ({
    users: s.users.map(u => u.id === id ? { ...u, locked: !u.locked } : u),
  })),

  auditLog: AUDIT_LOG,
  addAudit: (entry) => set(s => ({
    auditLog: [{ ...entry, id: Date.now() }, ...s.auditLog],
  })),

  toasts: [],
  showToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
