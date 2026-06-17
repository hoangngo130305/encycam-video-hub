import { req } from './api';
import type { Video, AuditEntry } from '../types';

export interface DashboardStats {
  // BTV
  total?: number;
  reviewing?: number;
  needsRevision?: number;
  approved?: number;
  rejected?: number;
  pending?: number;
  // Reviewer
  reviewed?: number;
  timeoutCount?: number;
  // Final
  waitingApprove?: number;
  // Admin
  totalVideos?: number;
  activeUsers?: number;
  lockedUsers?: number;
  totalUsers?: number;
}

export interface DashboardData {
  role: string;
  stats: DashboardStats;
  statusDistribution?: Record<string, number>;
  recentVideos?: Video[];
  queue?: Video[];
  waitingVideos?: Video[];
  recentActivity?: AuditEntry[];
}

export const dashboardService = {
  get: () => req<DashboardData>('/api/dashboard/'),
};
