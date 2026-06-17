import { create } from 'zustand';
import type { User, Video, Comment, Notification, AuditEntry, Toast, ToastType } from '../types';
import { clearTokens } from '../services/api';
import { authService } from '../services/authService';

interface AppState {
  // Auth
  currentUser: User | null;
  authLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  initAuth: () => Promise<void>;

  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Videos (list cache)
  videos: Video[];
  setVideos: (videos: Video[]) => void;
  updateVideoInList: (video: Video) => void;
  getVideoById: (id: number) => Video | undefined;

  // Comments (per-video cache)
  comments: Record<number, Comment[]>;
  setComments: (videoId: number, comments: Comment[]) => void;
  addComment: (videoId: number, comment: Comment) => void;
  updateComment: (videoId: number, comment: Comment) => void;

  // Notifications (for current user, keyed by role for Sidebar badge compatibility)
  notifications: Record<string, Notification[]>;
  setNotifications: (role: string, notifs: Notification[]) => void;
  markAllRead: (role: string) => void;
  markOneRead: (role: string, id: number) => void;
  unreadCount: (role: string) => number;

  // Users (admin cache)
  users: User[];
  setUsers: (users: User[]) => void;
  updateUserInList: (user: User) => void;
  removeUserFromList: (id: number) => void;

  // Audit (admin cache)
  auditLog: AuditEntry[];
  setAuditLog: (entries: AuditEntry[]) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  currentUser: null,
  authLoading: true,

  login: (user) => set({ currentUser: user }),

  logout: () => {
    authService.logout().catch(() => {});
    clearTokens();
    set({
      currentUser: null,
      notifications: {},
      videos: [],
      comments: {},
      users: [],
      auditLog: [],
    });
  },

  initAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ authLoading: false });
      return;
    }
    try {
      const user = await authService.me();
      set({ currentUser: user, authLoading: false });
    } catch {
      clearTokens();
      set({ currentUser: null, authLoading: false });
    }
  },

  // Theme
  darkMode: false,
  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    document.documentElement.classList.toggle('dark', next);
  },

  // Sidebar
  sidebarCollapsed: false,
  sidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Videos
  videos: [],
  setVideos: (videos) => set({ videos }),
  updateVideoInList: (video) =>
    set(s => ({
      videos: s.videos.map(v => v.id === video.id ? video : v),
    })),
  getVideoById: (id) => get().videos.find(v => v.id === id),

  // Legacy aliases used by some pages (no-ops now, data comes from API)
  addVideo: (video: Video) => set(s => ({ videos: [video, ...s.videos] })),
  updateVideoStatus: (id: number, status: Video['status']) =>
    set(s => ({ videos: s.videos.map(v => v.id === id ? { ...v, status } : v) })),
  bumpVideoVersion: (id: number) =>
    set(s => ({ videos: s.videos.map(v => v.id === id ? { ...v, currentVersion: v.currentVersion + 1 } : v) })),

  // Comments
  comments: {},
  setComments: (videoId, comments) =>
    set(s => ({ comments: { ...s.comments, [videoId]: comments } })),
  addComment: (videoId, comment) =>
    set(s => ({ comments: { ...s.comments, [videoId]: [...(s.comments[videoId] ?? []), comment] } })),
  updateComment: (videoId, comment) =>
    set(s => ({
      comments: {
        ...s.comments,
        [videoId]: (s.comments[videoId] ?? []).map(c => c.id === comment.id ? comment : c),
      },
    })),
  resolveComment: (videoId: number, commentId: number) =>
    set(s => ({
      comments: {
        ...s.comments,
        [videoId]: (s.comments[videoId] ?? []).map(c => c.id === commentId ? { ...c, resolved: true } : c),
      },
    })),

  // Notifications
  notifications: {},
  setNotifications: (role, notifs) =>
    set(s => ({ notifications: { ...s.notifications, [role]: notifs } })),
  markAllRead: (role) =>
    set(s => ({
      notifications: {
        ...s.notifications,
        [role]: (s.notifications[role] ?? []).map(n => ({ ...n, read: true })),
      },
    })),
  markOneRead: (role, id) =>
    set(s => ({
      notifications: {
        ...s.notifications,
        [role]: (s.notifications[role] ?? []).map(n => n.id === id ? { ...n, read: true } : n),
      },
    })),
  unreadCount: (role) => (get().notifications[role] ?? []).filter(n => !n.read).length,

  // Users
  users: [],
  setUsers: (users) => set({ users }),
  updateUserInList: (user) =>
    set(s => ({ users: s.users.map(u => u.id === user.id ? user : u) })),
  removeUserFromList: (id) =>
    set(s => ({ users: s.users.filter(u => u.id !== id) })),

  // Legacy aliases
  addUser: (user: User) => set(s => ({ users: [...s.users, user] })),
  updateUser: (id: number, updates: Partial<User>) =>
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...updates } : u) })),
  toggleLock: (id: number) =>
    set(s => ({ users: s.users.map(u => u.id === id ? { ...u, locked: !u.locked } : u) })),

  // Audit
  auditLog: [],
  setAuditLog: (entries) => set({ auditLog: entries }),
  addAudit: () => {}, // no-op, audit is server-side now

  // Toasts
  toasts: [],
  showToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
