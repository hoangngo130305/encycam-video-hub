export type Role = 'admin' | 'btv' | 'reviewer' | 'final' | 'sale_manager' | 'sale';

export interface Category {
  id: number;
  name: string;
  youtubePlaylistId: string;
  youtubeCategoryId: string;
  forSale: boolean;
}

export type VideoStatus =
  | 'pending'
  | 'reviewing'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'needs_revision';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  allRoles: Role[];
  initials: string;
  avatarBg: string;
  avatarColor: string;
  locked: boolean;
  createdAt: string;
  telegramChatId?: string;
}

export function hasRole(user: User, ...roles: Role[]): boolean {
  const all = user.allRoles?.length ? user.allRoles : [user.role];
  return roles.some(r => all.includes(r));
}

export interface VideoVersion {
  number: number;
  uploadedAt: string;
  uploadedBy: string;
  file?: string | null;
  fileSize: string;
  duration: string;
}

export interface Video {
  id: number;
  title: string;
  fileId: string;
  status: VideoStatus;
  currentVersion: number;
  versions: VideoVersion[];
  btv: User;
  reviewer?: User;
  uploadedAt: string;
  updatedAt: string;
  notes?: string;
  thumbGradient: string;
  history: HistoryEntry[];
  category: string;
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  youtubeUploadStatus?: 'idle' | 'uploading' | 'done' | 'failed';
  youtubeUploadProgress?: number;
}


export interface Comment {
  id: number;
  videoId: number;
  user: User;
  text: string;
  timestamp?: string;
  resolved: boolean;
  createdAt: string;
}

export interface HistoryEntry {
  id: number;
  timestamp: string;
  user: User;
  action: string;
  fromStatus?: VideoStatus;
  toStatus?: VideoStatus;
}

export interface Notification {
  id: number;
  type: 'comment' | 'approve' | 'reject' | 'upload' | 'mention' | 'timeout' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  videoId?: number;
  videoTitle?: string;
  forRoles?: Role[];
}

export interface SaleProject {
  id: number;
  name: string;
  category: Category;
  sale: User | null;
  saleManager: User;
  createdAt: string;
}

export interface SaleVideo {
  id: number;
  title: string;
  fileId: string;
  status: VideoStatus;
  currentVersion: number;
  uploader: User;
  saleProject: SaleProject;
  uploadedAt: string;
  updatedAt: string;
  thumbGradient: string;
  notes: string;
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  youtubeUploadStatus?: 'idle' | 'uploading' | 'done' | 'failed';
  youtubeUploadProgress?: number;
  versions?: VideoVersion[];
  history?: HistoryEntry[];
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  user: User;
  action: string;
  resourceType: 'video' | 'user' | 'system';
  resourceId?: number;
  details?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
