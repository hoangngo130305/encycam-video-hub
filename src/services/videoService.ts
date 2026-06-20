import { req, downloadReq } from './api';
import type { Video, Comment } from '../types';

interface VideoListParams {
  status?: string;
  search?: string;
}

export const videoService = {
  list: (params: VideoListParams = {}): Promise<Video[]> => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<string, string>
    ).toString();
    return req<Video[]>(`/api/videos/${qs ? '?' + qs : ''}`);
  },

  get: (id: number) => req<Video>(`/api/videos/${id}/`),

  create: (formData: FormData) =>
    req<Video>('/api/videos/', { method: 'POST', body: formData }),

  reupload: (id: number, formData: FormData) =>
    req<Video>(`/api/videos/${id}/reupload/`, { method: 'POST', body: formData }),

  startReview: (id: number) =>
    req<Video>(`/api/videos/${id}/start-review/`, { method: 'POST' }),

  sendToFinal: (id: number) =>
    req<Video>(`/api/videos/${id}/send-to-final/`, { method: 'POST' }),

  requestRevision: (id: number, note: string) =>
    req<Video>(`/api/videos/${id}/request-revision/`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  approve: (id: number) =>
    req<Video>(`/api/videos/${id}/approve/`, { method: 'POST' }),

  reject: (id: number, reason: string) =>
    req<Video>(`/api/videos/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  listComments: (videoId: number): Promise<Comment[]> =>
    req<Comment[]>(`/api/videos/${videoId}/comments/`),

  addComment: (videoId: number, text: string, timestamp?: string) =>
    req<Comment>(`/api/videos/${videoId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ text, timestamp: timestamp || null }),
    }),

  resolveComment: (commentId: number) =>
    req<Comment>(`/api/comments/${commentId}/resolve/`, { method: 'PATCH' }),

  download: (id: number, fileId: string, title: string, version: number) =>
    downloadReq(`/api/videos/${id}/download/`, `${fileId}_${title}_v${version}.mp4`),
};
