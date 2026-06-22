import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, MessageSquare, History, CheckCircle2, XCircle, Send,
  RotateCcw, Upload, Clock, Video, X, Download, ExternalLink
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { videoService } from '../services/videoService';
import { API_BASE } from '../config';
import TopBar from '../components/layout/TopBar';
import { StatusBadge, Avatar, Button, Card, Modal, WorkflowTimeline, Textarea, EmptyState } from '../components/ui';
import { cn } from '../lib/utils';
import type { Video as VideoType, Comment } from '../types';

/**
 * Đảm bảo URL media luôn dùng đúng origin của API_BASE.
 * DRF đôi khi build URL với host nội bộ (127.0.0.1) khi chạy sau proxy —
 * hàm này ghi đè origin bằng API_BASE để máy khác luôn load được.
 */
function toMediaUrl(url: string): string {
  if (!url) return '';
  try {
    const media = new URL(url);
    const api   = new URL(API_BASE);
    media.protocol = api.protocol;
    media.host     = api.host;
    return media.toString();
  } catch {
    return url.startsWith('/') ? `${API_BASE}${url}` : url;
  }
}

type Tab = 'video' | 'comments' | 'history';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, updateVideoInList, showToast } = useAppStore();

  const [video, setVideo] = useState<VideoType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('video');
  const [commentText, setCommentText] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [sendFinalModal, setSendFinalModal] = useState(false);
  const [revisionModal, setRevisionModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNote, setRevisionNote] = useState('');

  const videoId = Number(id);

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    Promise.all([
      videoService.get(videoId),
      videoService.listComments(videoId),
    ]).then(([v, c]) => {
      setVideo(v);
      setComments(c);
    }).catch(() => {
      setVideo(null);
    }).finally(() => setLoading(false));
  }, [videoId]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Đang tải..." actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Video không tìm thấy" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={<Video size={24} />} title="Video không tồn tại"
            action={<Button variant="secondary" onClick={() => navigate('/videos')}>Quay lại</Button>} />
        </div>
      </div>
    );
  }

  const role = currentUser.role;
  const openComments = comments.filter(c => !c.resolved).length;
  const currentVersionNum = selectedVersion ?? video.currentVersion;

  const withAction = async (fn: () => Promise<VideoType>) => {
    setActionLoading(true);
    try {
      const updated = await fn();
      setVideo(updated);
      updateVideoInList(updated);
      return true;
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const doStartReview = async () => {
    const ok = await withAction(() => videoService.startReview(video.id));
    if (ok) showToast('Đã bắt đầu review', 'success');
  };

  const doApprove = async () => {
    const ok = await withAction(() => videoService.approve(video.id));
    if (ok) {
      showToast(`✅ Đã approve "${video.title}"`, 'success');
      setApproveModal(false);
      navigate('/dashboard');
    }
  };

  const doReject = async () => {
    if (!rejectReason.trim()) { showToast('Vui lòng nhập lý do từ chối', 'error'); return; }
    const ok = await withAction(() => videoService.reject(video.id, rejectReason));
    if (ok) {
      showToast('Video đã bị reject. Thông báo đã gửi tới BTV.', 'error');
      setRejectModal(false);
      navigate('/dashboard');
    }
  };

  const doSendFinal = async () => {
    if (openComments > 0) {
      showToast(`Còn ${openComments} comment chưa resolve. Hãy xử lý hết trước khi chuyển.`, 'warning');
      return;
    }
    const ok = await withAction(() => videoService.sendToFinal(video.id));
    if (ok) {
      showToast(`Đã chuyển "${video.title}" lên Duyệt cuối`, 'success');
      setSendFinalModal(false);
      navigate('/dashboard');
    }
  };

  const doRequestRevision = async () => {
    if (!revisionNote.trim()) { showToast('Vui lòng nhập tóm tắt yêu cầu', 'error'); return; }
    const ok = await withAction(() => videoService.requestRevision(video.id, revisionNote));
    if (ok) {
      showToast('Đã gửi yêu cầu sửa lại tới BTV', 'warning');
      setRevisionModal(false);
      navigate('/dashboard');
    }
  };

  const doAddComment = async () => {
    if (!commentText.trim()) { showToast('Vui lòng nhập nội dung comment', 'error'); return; }
    const tsMatch = commentText.match(/\b(\d{1,2}:\d{2})\b/);
    try {
      const comment = await videoService.addComment(video.id, commentText, tsMatch?.[1]);
      setComments(prev => [...prev, comment]);
      setCommentText('');
      showToast('Đã gửi comment', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể gửi comment', 'error');
    }
  };

  const doResolve = async (cId: number) => {
    try {
      const updated = await videoService.resolveComment(cId);
      setComments(prev => prev.map(c => c.id === cId ? updated : c));
      showToast('Đã đánh dấu comment là đã xử lý', 'success');
    } catch {
      showToast('Không thể resolve comment', 'error');
    }
  };

  const doDownload = async () => {
    if (!video) return;
    setDownloadLoading(true);
    try {
      await videoService.download(video.id, video.fileId, video.title, video.currentVersion);
      showToast(`Đang tải xuống "${video.title}"`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể tải video', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const backBtn = <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>;
  const reuploadBtn = (role === 'btv' && (video.status === 'needs_revision' || video.status === 'rejected')) ? (
    <Button variant="primary" size="sm" icon={<Upload size={13} />} onClick={() => navigate(`/upload?reupload=${video.id}`)}>
      Re-upload v{video.currentVersion + 1}
    </Button>
  ) : null;
  const downloadBtn = ((role === 'admin' || role === 'final') && video.status === 'approved') ? (
    <Button variant="success" size="sm" icon={<Download size={13} />} loading={downloadLoading} onClick={doDownload}>
      Tải xuống
    </Button>
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <TopBar title={video.title} subtitle={`${video.fileId} · v${video.currentVersion}`}
        actions={<div className="flex gap-2">{backBtn}{reuploadBtn}{downloadBtn}</div>} />

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {(['video', 'comments', 'history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
              activeTab === t ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-500')}>
            {t === 'video' ? 'Video' : t === 'comments' ? `Comments (${openComments})` : 'Lịch sử'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-5">

            {/* Left column */}
            <div className={cn('space-y-4', activeTab !== 'video' && 'hidden lg:block')}>
              {/* Player */}
              <Card className="overflow-hidden">
                {(() => {
                  const ver = video.versions?.find(v => v.number === currentVersionNum);
                  return ver?.file ? (
                    <video
                      key={`${video.id}-v${currentVersionNum}`}
                      controls
                      className="w-full aspect-video bg-black"
                      preload="metadata"
                    >
                      <source src={toMediaUrl(ver.file)} type="video/mp4" />
                    </video>
                  ) : (
                    <div className={`aspect-video bg-gradient-to-br ${video.thumbGradient} relative flex items-center justify-center`}>
                      <div className="flex flex-col items-center gap-2 text-white/80">
                        <Play size={32} className="opacity-60" />
                        <span className="text-xs">Chưa có file video</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="p-4">
                  <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-3">{video.title}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm mb-3">
                    {video.btv && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
                        <span className="text-gray-400">BTV:</span>
                        <Avatar name={video.btv.name} initials={video.btv.initials} bg={video.btv.avatarBg} color={video.btv.avatarColor} size="xs" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{video.btv.name}</span>
                      </div>
                    )}
                    {video.reviewer && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
                        <span className="text-gray-400">Reviewer:</span>
                        <Avatar name={video.reviewer.name} initials={video.reviewer.initials} bg={video.reviewer.avatarBg} color={video.reviewer.avatarColor} size="xs" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{video.reviewer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <StatusBadge status={video.status} />
                    </div>
                    {video.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        {video.category}
                      </span>
                    )}
                  </div>

                  {/* Version switcher */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold">Phiên bản:</span>
                    {(video.versions ?? []).map(ver => (
                      <button key={ver.number} onClick={() => setSelectedVersion(ver.number)}
                        className={cn('font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all',
                          currentVersionNum === ver.number
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300')}>
                        v{ver.number}{ver.number === video.currentVersion ? ' (hiện tại)' : ''}
                      </button>
                    ))}
                  </div>

                  {video.versions?.[currentVersionNum - 1] && (
                    <div className="mt-2 flex gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>Tải lên: {timeAgo(video.versions[currentVersionNum - 1].uploadedAt)}</span>
                      <span>Kích thước: {video.versions[currentVersionNum - 1].fileSize}</span>
                    </div>
                  )}

                  {video.youtubeUrl && (
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      Xem trên YouTube
                      <ExternalLink size={10} />
                    </a>
                  )}
                  {video.status === 'approved' && !video.youtubeUrl && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock size={10} /> Đang đăng lên YouTube...
                    </p>
                  )}
                </div>
              </Card>

              {/* Workflow timeline */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <CheckCircle2 size={11} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Tiến trình duyệt</span>
                </div>
                <WorkflowTimeline status={video.status} />
              </Card>

              {/* History */}
              <Card className={cn('overflow-hidden', activeTab !== 'history' && 'hidden lg:block')}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <History size={14} className="text-gray-400" />
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Lịch sử duyệt</span>
                  <span className="ml-auto text-xs text-gray-400">{(video.history ?? []).length} bước</span>
                </div>
                <div>
                  {(video.history ?? []).map((entry, i, arr) => (
                    <div key={entry.id}
                      className={cn('flex items-start gap-3 px-4 py-3 text-sm', i < arr.length - 1 && 'border-b border-gray-100 dark:border-gray-800')}>
                      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          i === arr.length - 1 ? 'bg-blue-600 text-white' : 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400')}>
                          {i === arr.length - 1 ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                        </div>
                        {i < arr.length - 1 && <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.user && (
                            <>
                              <Avatar name={entry.user.name} initials={entry.user.initials} bg={entry.user.avatarBg} color={entry.user.avatarColor} size="xs" />
                              <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">{entry.user.name}</span>
                            </>
                          )}
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-600 ml-auto">{timeAgo(entry.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{entry.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action panels */}
              {role === 'reviewer' && video.status === 'pending' && (
                <Card className="p-4 border-l-4 border-blue-500">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Bắt đầu review</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Nhận video này vào hàng chờ của bạn để bắt đầu review.</p>
                  <Button variant="primary" loading={actionLoading} icon={<CheckCircle2 size={13} />} onClick={doStartReview}>
                    Bắt đầu Review
                  </Button>
                </Card>
              )}

              {role === 'reviewer' && ['reviewing', 'needs_revision'].includes(video.status) && (
                <Card className="p-4 border-l-4 border-violet-500">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Kết luận review</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Chỉ approve khi đã resolve hết toàn bộ comments open.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="success" icon={<Send size={13} />} loading={actionLoading} onClick={() => setSendFinalModal(true)}>Chuyển lên Duyệt cuối</Button>
                    <Button variant="warning" icon={<RotateCcw size={13} />} loading={actionLoading} onClick={() => setRevisionModal(true)}>Yêu cầu sửa lại</Button>
                  </div>
                </Card>
              )}

              {(role === 'final' || role === 'admin') && video.status === 'reviewed' && (
                <Card className="p-4 border-l-4 border-orange-500">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Quyết định duyệt cuối</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Approve để xuất bản và đăng lên YouTube. Nếu reject, BTV và Reviewer sẽ nhận thông báo.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="success" icon={<CheckCircle2 size={13} />} loading={actionLoading} onClick={() => setApproveModal(true)}>Approve — Xuất bản</Button>
                    <Button variant="danger" icon={<XCircle size={13} />} loading={actionLoading} onClick={() => setRejectModal(true)}>Reject — Từ chối</Button>
                  </div>
                </Card>
              )}

              {(role === 'admin' || role === 'final') && video.status === 'approved' && (
                <Card className="p-4 border-l-4 border-green-500">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Tải xuống video</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                    Video đã được duyệt cuối. Tải về phiên bản hiện tại (v{video.currentVersion}).
                  </p>
                  <Button variant="success" icon={<Download size={13} />} loading={downloadLoading} onClick={doDownload}>
                    Tải xuống v{video.currentVersion}
                  </Button>
                </Card>
              )}
            </div>

            {/* Right column — comments */}
            <div className={cn('flex flex-col', activeTab === 'comments' || activeTab === 'video' ? 'lg:flex' : 'hidden lg:flex')}>
              <Card className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-gray-400" />
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Comments</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {openComments > 0 && (
                      <span className="bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full font-semibold">
                        {openComments} open
                      </span>
                    )}
                    <span className="text-gray-400">{comments.filter(c => c.resolved).length} resolved</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {comments.length === 0 ? (
                    <EmptyState icon={<MessageSquare size={20} />} title="Chưa có comment nào" description="Comment đầu tiên để bắt đầu review" />
                  ) : comments.map(c => (
                    <div key={c.id} className={cn('rounded-xl border transition-all',
                      c.resolved
                        ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 opacity-60'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm')}>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={c.user.name} initials={c.user.initials} bg={c.user.avatarBg} color={c.user.avatarColor} size="xs" />
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{c.user.name}</span>
                          {c.timestamp && (
                            <span className="font-mono text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                              {c.timestamp}
                            </span>
                          )}
                          <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{c.text}</p>
                      </div>

                      {/* Resolve bar */}
                      {c.resolved ? (
                        <div className="px-3 py-2 border-t border-green-100 dark:border-green-900/40 bg-green-50/60 dark:bg-green-950/20 rounded-b-xl flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">Đã xử lý</span>
                        </div>
                      ) : (role === 'reviewer' || role === 'final') ? (
                        <button
                          onClick={() => doResolve(c.id)}
                          className="w-full px-3 py-2 border-t border-orange-100 dark:border-orange-900/40 bg-orange-50/60 dark:bg-orange-950/20 rounded-b-xl flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:border-green-800 group transition-all"
                        >
                          <CheckCircle2 size={14} className="text-orange-400 dark:text-orange-500 group-hover:text-green-600 dark:group-hover:text-green-400 flex-shrink-0 transition-colors" />
                          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                            Chưa xử lý — Nhấn để đánh dấu đã xử lý
                          </span>
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                {role !== 'btv' ? (
                  <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <Textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="Thêm comment… gợi ý: thêm mm:ss để gắn timestamp, VD: 04:32"
                      className="text-xs min-h-[60px] max-h-28" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-400">
                        <Clock size={10} className="inline mr-1" />Thêm timestamp vào comment
                      </span>
                      <Button variant="primary" size="xs" icon={<Send size={11} />} onClick={doAddComment}>Gửi</Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800/30 flex-shrink-0">
                    Bạn chỉ có thể xem comments của Reviewer. Re-upload để phản hồi.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)}
        title="✅ Xác nhận Approve" size="sm" titleColor="text-green-600 dark:text-green-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setApproveModal(false)}>Huỷ</Button>
          <Button variant="success" size="sm" loading={actionLoading} icon={<CheckCircle2 size={13} />} onClick={doApprove}>Xác nhận Approve</Button>
        </>}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Bạn xác nhận <strong>approve</strong> video <strong>"{video.title}"</strong>?<br /><br />
          Video sẽ được đánh dấu <strong className="text-green-600 dark:text-green-400">Đã duyệt</strong> và BTV + Reviewer sẽ nhận được thông báo.
        </p>
      </Modal>

      <Modal open={rejectModal} onClose={() => { setRejectModal(false); setRejectReason(''); }}
        title="❌ Từ chối video" titleColor="text-red-600 dark:text-red-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setRejectModal(false)}>Huỷ</Button>
          <Button variant="danger" size="sm" loading={actionLoading} icon={<XCircle size={13} />} onClick={doReject}>Xác nhận Reject</Button>
        </>}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Video: <strong className="text-gray-900 dark:text-gray-100">"{video.title}"</strong></p>
        <Textarea label="Lý do từ chối *" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="Mô tả rõ lý do để BTV biết cần sửa gì..." className="min-h-[80px]" />
      </Modal>

      <Modal open={sendFinalModal} onClose={() => setSendFinalModal(false)}
        title="📤 Chuyển lên Duyệt cuối" size="sm" titleColor="text-violet-600 dark:text-violet-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setSendFinalModal(false)}>Huỷ</Button>
          <Button variant="primary" size="sm" loading={actionLoading} icon={<Send size={13} />} onClick={doSendFinal}>Chuyển lên Duyệt cuối</Button>
        </>}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Bạn xác nhận đã review xong video <strong>"{video.title}"</strong> và chuyển lên Duyệt cuối?<br /><br />
          Tất cả comments phải được resolve trước khi chuyển.
          {openComments > 0 && <span className="block mt-2 text-orange-600 dark:text-orange-400 font-semibold">⚠️ Còn {openComments} comment chưa resolve!</span>}
        </p>
      </Modal>

      <Modal open={revisionModal} onClose={() => { setRevisionModal(false); setRevisionNote(''); }}
        title="🔄 Yêu cầu sửa lại" titleColor="text-orange-600 dark:text-orange-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setRevisionModal(false)}>Huỷ</Button>
          <Button variant="warning" size="sm" loading={actionLoading} icon={<RotateCcw size={13} />} onClick={doRequestRevision}>Gửi yêu cầu sửa</Button>
        </>}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Video: <strong className="text-gray-900 dark:text-gray-100">"{video.title}"</strong></p>
        <Textarea label="Tóm tắt yêu cầu sửa *" value={revisionNote} onChange={e => setRevisionNote(e.target.value)}
          placeholder="Mô tả ngắn gọn cần sửa gì..." className="min-h-[70px]" />
      </Modal>
    </div>
  );
}
