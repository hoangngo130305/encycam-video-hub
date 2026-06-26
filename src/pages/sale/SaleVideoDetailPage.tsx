import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, History, CheckCircle2, XCircle, RotateCcw,
  Upload, Clock, Video, ExternalLink, CloudUpload, FileVideo, X, AlertCircle, Download,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { saleVideoService } from '../../services/saleVideoService';
import { videoService } from '../../services/videoService';
import { API_BASE } from '../../config';
import TopBar from '../../components/layout/TopBar';
import { StatusBadge, Avatar, Button, Card, Modal, Textarea, EmptyState } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { SaleVideo, VideoStatus } from '../../types';

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

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

// Sale-specific 3-step workflow timeline
function SaleWorkflowTimeline({ status }: { status: VideoStatus }) {
  const steps = [
    { key: 'pending',   short: 'Chờ duyệt' },
    { key: 'reviewing', short: 'Đang xem' },
    { key: 'approved',  short: 'Đã duyệt' },
  ];
  const isTerminal  = status === 'rejected' || status === 'needs_revision';
  const activeIdx   = isTerminal ? 1 : steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const isDone        = i < activeIdx;
        const isActive      = i === activeIdx && !isTerminal;
        const isTerminalHere = isTerminal && i === 1;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                isDone        ? 'bg-green-500 border-green-500 text-white' :
                isActive      ? 'bg-yellow-500 border-yellow-500 text-white' :
                isTerminalHere ? (status === 'rejected'
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-orange-500 border-orange-500 text-white')
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400',
              )}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={cn(
                'mt-1 text-[10px] font-semibold text-center leading-tight whitespace-nowrap',
                (isDone || isActive || isTerminalHere) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600',
              )}>
                {isTerminalHere
                  ? (status === 'rejected' ? 'Từ chối' : 'Cần sửa')
                  : step.short}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mx-1 mt-[-14px] rounded transition-all',
                isDone ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

type Tab = 'video' | 'history';
type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export default function SaleVideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, showToast } = useAppStore();

  const [video, setVideo]               = useState<SaleVideo | null>(null);
  const [loading, setLoading]           = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab]       = useState<Tab>('video');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const [approveModal,   setApproveModal]   = useState(false);
  const [rejectModal,    setRejectModal]    = useState(false);
  const [revisionModal,  setRevisionModal]  = useState(false);
  const [rejectReason,   setRejectReason]   = useState('');
  const [revisionNote,   setRevisionNote]   = useState('');

  const [uploadState,    setUploadState]    = useState<UploadState>('idle');
  const [uploadFile,     setUploadFile]     = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [drag,           setDrag]           = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const videoId    = Number(id);
  const isManager  = currentUser?.role === 'sale_manager' || currentUser?.role === 'admin';
  const isAdmin    = currentUser?.role === 'admin';
  const isSale     = currentUser?.role === 'sale';
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!videoId) return;
    saleVideoService.get(videoId)
      .then(v => { setVideo(v); setSelectedVersion(v.currentVersion); })
      .catch(() => setVideo(null))
      .finally(() => setLoading(false));
  }, [videoId]);

  // Poll khi approved nhưng YouTube chưa xong
  useEffect(() => {
    const shouldPoll = video?.status === 'approved' &&
      !video.youtubeUrl &&
      video.youtubeUploadStatus === 'uploading';
    if (shouldPoll) {
      pollRef.current = setInterval(async () => {
        try {
          const updated = await saleVideoService.get(videoId);
          setVideo(updated);
          if (updated.youtubeUrl || updated.youtubeUploadStatus === 'done' || updated.youtubeUploadStatus === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch { /* ignore */ }
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [video?.status, video?.youtubeUploadStatus, videoId]);

  if (!currentUser) return null;

  /* ── actions ── */
  const withAction = async (fn: () => Promise<SaleVideo>) => {
    setActionLoading(true);
    try {
      const updated = await fn();
      setVideo(updated);
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi thao tác', 'error');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartReview = async () => {
    const ok = await withAction(() => saleVideoService.startReview(videoId));
    if (ok) showToast('Đã bắt đầu xem video. Sale sẽ nhận thông báo.', 'success');
  };

  const handleApprove = async () => {
    const ok = await withAction(() => saleVideoService.approve(videoId));
    if (ok) { showToast('✅ Đã approve video', 'success'); setApproveModal(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Vui lòng nhập lý do từ chối', 'error'); return; }
    const ok = await withAction(() => saleVideoService.reject(videoId, rejectReason.trim()));
    if (ok) { showToast('Video đã bị từ chối. Thông báo đã gửi tới Sale.', 'error'); setRejectModal(false); setRejectReason(''); }
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) { showToast('Vui lòng nhập nội dung cần sửa', 'error'); return; }
    const ok = await withAction(() => saleVideoService.revision(videoId, revisionNote.trim()));
    if (ok) { showToast('Đã gửi yêu cầu sửa tới Sale', 'warning'); setRevisionModal(false); setRevisionNote(''); }
  };

  const doDownload = async () => {
    if (!video) return;
    setDownloadLoading(true);
    try {
      await videoService.download(video.id, video.fileId, video.title, video.currentVersion);
      showToast(`Đang tải xuống "${video.title}"`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể tải video', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  /* ── re-upload ── */
  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.mp4')) { showToast('Chỉ nhận file .mp4', 'error'); return; }
    if (f.size > 4 * 1024 * 1024 * 1024) { showToast('File quá lớn (tối đa 4 GB)', 'error'); return; }
    setUploadFile(f); setUploadState('selected');
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const doReupload = async () => {
    if (!uploadFile || !video) return;
    setUploadState('uploading'); setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => { if (p >= 90) { clearInterval(interval); return 90; } return p + Math.random() * 8 + 2; });
    }, 300);
    const fd = new FormData();
    fd.append('file', uploadFile);
    try {
      const updated = await saleVideoService.reupload(videoId, fd);
      clearInterval(interval); setUploadProgress(100); setUploadState('success');
      setVideo(updated); setSelectedVersion(updated.currentVersion);
      showToast(`Re-upload thành công! v${updated.currentVersion} đã được tạo.`, 'success');
    } catch (err) {
      clearInterval(interval); setUploadState('error');
      showToast(err instanceof Error ? err.message : 'Upload thất bại', 'error');
    }
  };

  const resetUpload = () => {
    setUploadFile(null); setUploadState('idle'); setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Đang tải..."
          actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Video không tìm thấy"
          actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>} />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={<Video size={24} />} title="Video không tồn tại"
            action={<Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>} />
        </div>
      </div>
    );
  }

  const currentVersionNum = selectedVersion ?? video.currentVersion;
  const canStartReview = isManager && video.status === 'pending';
  const canDecide      = isManager && video.status === 'reviewing';
  const canReupload    = isSale   && video.status === 'needs_revision';
  const canDownload    = (isManager || isAdmin) && video.status === 'approved';

  const downloadBtn = canDownload ? (
    <Button variant="success" size="sm" icon={<Download size={13} />} loading={downloadLoading} onClick={doDownload}>
      Tải xuống
    </Button>
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={video.title}
        subtitle={`${video.saleProject?.name ?? ''} · v${video.currentVersion}`}
        actions={
          <div className="flex gap-2">
            {downloadBtn}
            <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>
          </div>
        }
      />

      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {(['video', 'history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
              activeTab === t
                ? 'text-yellow-600 dark:text-yellow-400 border-b-2 border-yellow-500'
                : 'text-gray-500 dark:text-gray-500')}>
            {t === 'video' ? 'Video' : 'Lịch sử'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="space-y-4">

            {/* ── Video player card ── */}
            <Card className={cn('overflow-hidden', activeTab !== 'video' && 'hidden lg:block')}>
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

                {/* Metadata row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm mb-3">
                  {video.uploader && (
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
                      <span className="text-gray-400">Sale:</span>
                      <Avatar name={video.uploader.name} initials={video.uploader.initials}
                        bg={video.uploader.avatarBg} color={video.uploader.avatarColor} size="xs" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{video.uploader.name}</span>
                    </div>
                  )}
                  {video.saleProject?.name && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-800">
                      {video.saleProject.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <StatusBadge status={video.status} />
                  </div>
                  {video.saleProject?.category?.name && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                      {video.saleProject.category.name}
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
                          ? 'bg-yellow-500 border-yellow-500 text-white'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-yellow-300')}>
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

                {video.youtubeUrl ? (
                  <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Xem trên YouTube
                    <ExternalLink size={10} />
                  </a>
                ) : video.status === 'approved' && video.youtubeUploadStatus === 'failed' ? (
                  <p className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <XCircle size={12} /> Đăng lên YouTube thất bại. Vui lòng liên hệ Admin.
                  </p>
                ) : video.status === 'approved' && video.youtubeUploadStatus === 'uploading' ? (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-semibold">
                        <div className="w-2.5 h-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        Đang đăng lên YouTube...
                      </span>
                      {(video.youtubeUploadProgress ?? 0) > 0 && (
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          {video.youtubeUploadProgress}%
                        </span>
                      )}
                    </div>
                    {(video.youtubeUploadProgress ?? 0) > 0 && (
                      <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${video.youtubeUploadProgress}%` }} />
                      </div>
                    )}
                  </div>
                ) : null}

                {video.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Ghi chú:</span> {video.notes}
                  </div>
                )}
              </div>
            </Card>

            {/* ── Tiến trình duyệt ── */}
            <Card className={cn('p-4', activeTab !== 'video' && 'hidden lg:block')}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-md bg-yellow-50 dark:bg-yellow-950/40 flex items-center justify-center">
                  <CheckCircle2 size={11} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Tiến trình duyệt</span>
              </div>
              <SaleWorkflowTimeline status={video.status} />
            </Card>

            {/* ── Lịch sử duyệt ── */}
            <Card className={cn('overflow-hidden', activeTab !== 'history' && 'hidden lg:block')}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <History size={14} className="text-gray-400" />
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Lịch sử duyệt</span>
                <span className="ml-auto text-xs text-gray-400">{(video.history ?? []).length} bước</span>
              </div>
              <div>
                {(!video.history || video.history.length === 0) ? (
                  <EmptyState icon={<Clock size={20} />} title="Chưa có lịch sử"
                    description="Lịch sử thao tác sẽ xuất hiện ở đây." />
                ) : [...video.history].reverse().map((entry, i, arr) => (
                  <div key={entry.id}
                    className={cn('flex items-start gap-3 px-4 py-3 text-sm',
                      i < arr.length - 1 && 'border-b border-gray-100 dark:border-gray-800')}>
                    <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                        i === 0
                          ? 'bg-yellow-500 text-white'
                          : 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400')}>
                        {i === 0 ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                      </div>
                      {i < arr.length - 1 && <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.user && (
                          <>
                            <Avatar name={entry.user.name} initials={entry.user.initials}
                              bg={entry.user.avatarBg} color={entry.user.avatarColor} size="xs" />
                            <span className="font-semibold text-xs text-yellow-600 dark:text-yellow-400">
                              {entry.user.name}
                            </span>
                          </>
                        )}
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-600 ml-auto">
                          {timeAgo(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{entry.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ── Sale Manager: Bắt đầu xem (pending) ── */}
            {canStartReview && (
              <Card className={cn('p-4 border-l-4 border-yellow-500', activeTab !== 'video' && 'hidden lg:block')}>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Xem và duyệt video</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  Bấm "Bắt đầu xem" để chuyển video sang trạng thái đang review — Sale sẽ nhận thông báo.
                </p>
                <Button variant="primary" icon={<Play size={13} />} loading={actionLoading} onClick={handleStartReview}
                  className="bg-yellow-500 hover:bg-yellow-600">
                  Bắt đầu xem
                </Button>
              </Card>
            )}

            {/* ── Sale Manager: Quyết định duyệt (reviewing) ── */}
            {canDecide && (
              <Card className={cn('p-4 border-l-4 border-violet-500', activeTab !== 'video' && 'hidden lg:block')}>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Quyết định duyệt</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  Xem video rồi đưa ra quyết định: duyệt, yêu cầu sửa, hoặc từ chối.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="success" icon={<CheckCircle2 size={13} />} loading={actionLoading} onClick={() => setApproveModal(true)}>
                    Approve
                  </Button>
                  <Button variant="warning" icon={<RotateCcw size={13} />} loading={actionLoading} onClick={() => setRevisionModal(true)}>
                    Yêu cầu sửa lại
                  </Button>
                  <Button variant="danger" icon={<XCircle size={13} />} loading={actionLoading} onClick={() => setRejectModal(true)}>
                    Từ chối
                  </Button>
                </div>
              </Card>
            )}

            {isManager && !canStartReview && !canDecide && !canDownload && (
              <Card className={cn('p-4', activeTab !== 'video' && 'hidden lg:block')}>
                <p className="text-xs text-gray-400">Không có thao tác nào cho trạng thái hiện tại.</p>
              </Card>
            )}

            {/* ── Download card (approved) ── */}
            {canDownload && (
              <Card className={cn('p-4 border-l-4 border-green-500', activeTab !== 'video' && 'hidden lg:block')}>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Tải xuống video</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  Video đã được duyệt. Tải về phiên bản hiện tại (v{video.currentVersion}).
                </p>
                <Button variant="success" icon={<Download size={13} />} loading={downloadLoading} onClick={doDownload}>
                  Tải xuống v{video.currentVersion}
                </Button>
              </Card>
            )}

            {/* ── Sale: re-upload ── */}
            {canReupload && (
              <Card className={cn('p-4 border-l-4 border-orange-500', activeTab !== 'video' && 'hidden lg:block')}>
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Cần sửa lại — Upload phiên bản mới
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                  Sale Manager đã yêu cầu sửa. Upload phiên bản v{video.currentVersion + 1}.
                </p>

                {video.history && video.history.filter(h => h.toStatus === 'needs_revision').length > 0 && (
                  <div className="mb-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold mb-1">Ghi chú từ Sale Manager:</p>
                    {video.history.filter(h => h.toStatus === 'needs_revision').slice(-1).map(h => (
                      <p key={h.id} className="text-xs text-orange-700 dark:text-orange-400">{h.action}</p>
                    ))}
                  </div>
                )}

                {(uploadState === 'idle' || uploadState === 'selected') && (
                  <>
                    <div
                      onDragOver={e => { e.preventDefault(); setDrag(true); }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={handleDrop}
                      onClick={() => !uploadFile && fileRef.current?.click()}
                      className={cn(
                        'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                        drag        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 scale-[1.01]' :
                        uploadFile  ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' :
                                      'border-gray-300 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-700',
                      )}
                    >
                      <input ref={fileRef} type="file" accept=".mp4" className="hidden"
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                      {!uploadFile ? (
                        <div>
                          <CloudUpload size={24} className="text-orange-400 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kéo thả hoặc chọn file .mp4</p>
                          <p className="text-xs text-gray-500 mt-1">Tối đa 4 GB</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-left">
                          <FileVideo size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{uploadFile.name}</div>
                            <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Sẵn sàng upload</div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); resetUpload(); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <Button variant="primary" icon={<Upload size={14} />} onClick={doReupload} disabled={!uploadFile}>
                        Re-upload v{video.currentVersion + 1}
                      </Button>
                    </div>
                  </>
                )}

                {uploadState === 'uploading' && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <FileVideo size={18} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{uploadFile?.name}</span>
                      <span className="ml-auto font-mono text-sm font-bold text-blue-600">{Math.floor(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadState === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-semibold">Upload thành công! Video đang chờ Sale Manager review lại.</span>
                  </div>
                )}

                {uploadState === 'error' && (
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-400">Upload thất bại.</span>
                    <Button variant="ghost" size="sm" onClick={resetUpload}>Thử lại</Button>
                  </div>
                )}
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* ── Approve modal ── */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)}
        title="✅ Xác nhận Approve" size="sm" titleColor="text-green-600 dark:text-green-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setApproveModal(false)}>Huỷ</Button>
          <Button variant="success" size="sm" loading={actionLoading} icon={<CheckCircle2 size={13} />} onClick={handleApprove}>
            Xác nhận Approve
          </Button>
        </>}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Bạn xác nhận <strong>approve</strong> video <strong>"{video.title}"</strong>?<br /><br />
          Video sẽ được đánh dấu <strong className="text-green-600 dark:text-green-400">Đã duyệt</strong> và Sale sẽ nhận được thông báo.
        </p>
      </Modal>

      {/* ── Reject modal ── */}
      <Modal open={rejectModal} onClose={() => { setRejectModal(false); setRejectReason(''); }}
        title="❌ Từ chối video" titleColor="text-red-600 dark:text-red-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setRejectModal(false)}>Huỷ</Button>
          <Button variant="danger" size="sm" loading={actionLoading} icon={<XCircle size={13} />} onClick={handleReject}>
            Xác nhận Từ chối
          </Button>
        </>}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Video: <strong className="text-gray-900 dark:text-gray-100">"{video.title}"</strong>
        </p>
        <Textarea label="Lý do từ chối *" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="Mô tả rõ lý do để Sale biết..." className="min-h-[80px]" />
      </Modal>

      {/* ── Revision modal ── */}
      <Modal open={revisionModal} onClose={() => { setRevisionModal(false); setRevisionNote(''); }}
        title="🔄 Yêu cầu sửa lại" titleColor="text-orange-600 dark:text-orange-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setRevisionModal(false)}>Huỷ</Button>
          <Button variant="warning" size="sm" loading={actionLoading} icon={<RotateCcw size={13} />} onClick={handleRevision}>
            Gửi yêu cầu sửa
          </Button>
        </>}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Video: <strong className="text-gray-900 dark:text-gray-100">"{video.title}"</strong>
        </p>
        <Textarea label="Tóm tắt yêu cầu sửa *" value={revisionNote} onChange={e => setRevisionNote(e.target.value)}
          placeholder="Mô tả ngắn gọn cần sửa gì..." className="min-h-[70px]" />
      </Modal>
    </div>
  );
}
