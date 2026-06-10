import type { VideoStatus, Role } from '../types';

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const STATUS_CONFIG: Record<VideoStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  darkBg: string;
  darkColor: string;
  dot: string;
}> = {
  pending: {
    label: 'Chờ review',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-950/40',
    darkColor: 'dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  reviewing: {
    label: 'Đang review',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    darkBg: 'dark:bg-blue-950/40',
    darkColor: 'dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  reviewed: {
    label: 'Đã reviewed',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    darkBg: 'dark:bg-violet-950/40',
    darkColor: 'dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  approved: {
    label: 'Đã duyệt',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    darkBg: 'dark:bg-green-950/40',
    darkColor: 'dark:text-green-400',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Đã từ chối',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    darkBg: 'dark:bg-red-950/40',
    darkColor: 'dark:text-red-400',
    dot: 'bg-red-500',
  },
  needs_revision: {
    label: 'Cần sửa',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    darkBg: 'dark:bg-orange-950/40',
    darkColor: 'dark:text-orange-400',
    dot: 'bg-orange-500',
  },
};

export const ROLE_CONFIG: Record<Role, {
  label: string;
  color: string;
  bg: string;
}> = {
  admin: { label: 'Admin', color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800' },
  btv: { label: 'BTV', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800' },
  reviewer: { label: 'Reviewer', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800' },
  final: { label: 'Duyệt cuối', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800' },
};

export const WORKFLOW_STEPS: { status: VideoStatus; label: string }[] = [
  { status: 'pending', label: 'Chờ review' },
  { status: 'reviewing', label: 'Đang review' },
  { status: 'reviewed', label: 'Đã reviewed' },
  { status: 'approved', label: 'Approved' },
];

export function getWorkflowStep(status: VideoStatus): number {
  if (status === 'rejected' || status === 'needs_revision') return 2;
  const idx = WORKFLOW_STEPS.findIndex(s => s.status === status);
  return idx >= 0 ? idx : 0;
}
