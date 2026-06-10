import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, MessageSquare, History, CheckCircle2, XCircle, Send,
  RotateCcw, Upload, Clock, Video, ChevronDown, X
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import TopBar from '../components/layout/TopBar';
import { StatusBadge, Avatar, Button, Card, Modal, WorkflowTimeline, Textarea, EmptyState } from '../components/ui';
import { cn } from '../lib/utils';

type Tab = 'video' | 'comments' | 'history';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentUser, getVideoById, comments, addComment, resolveComment,
    updateVideoStatus, bumpVideoVersion, addAudit, showToast,
  } = useAppStore();

  const video = getVideoById(Number(id));
  const [activeTab, setActiveTab] = useState<Tab>('video');
  const [commentText, setCommentText] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [sendFinalModal, setSendFinalModal] = useState(false);
  const [revisionModal, setRevisionModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNote, setRevisionNote] = useState('');

  if (!currentUser || !video) {
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
  const vComments = comments[video.id] ?? [];
  const openComments = vComments.filter(c => !c.resolved).length;
  const currentVersionNum = selectedVersion ?? video.currentVersion;

  const doApprove = () => {
    updateVideoStatus(video.id, 'approved');
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Approve "${video.title}" — Published ✅`, resourceType: 'video', resourceId: video.id });
    showToast(`✅ Đã approve "${video.title}"`, 'success');
    setApproveModal(false);
    navigate('/dashboard');
  };

  const doReject = () => {
    if (!rejectReason.trim()) { showToast('Vui lòng nhập lý do từ chối', 'error'); return; }
    updateVideoStatus(video.id, 'rejected');
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Reject "${video.title}" — Lý do: ${rejectReason}`, resourceType: 'video', resourceId: video.id });
    showToast(`Video đã bị reject. Thông báo đã gửi tới BTV.`, 'error');
    setRejectModal(false);
    navigate('/dashboard');
  };

  const doSendFinal = () => {
    if (openComments > 0) { showToast(`Còn ${openComments} comment chưa resolve. Hãy xử lý hết trước khi chuyển.`, 'warning'); return; }
    updateVideoStatus(video.id, 'reviewed');
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Approve review "${video.title}" — chuyển Duyệt cuối`, resourceType: 'video', resourceId: video.id });
    showToast(`Đã chuyển "${video.title}" lên Duyệt cuối`, 'success');
    setSendFinalModal(false);
    navigate('/dashboard');
  };

  const doRequestRevision = () => {
    if (!revisionNote.trim()) { showToast('Vui lòng nhập tóm tắt yêu cầu', 'error'); return; }
    updateVideoStatus(video.id, 'needs_revision');
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Yêu cầu sửa "${video.title}" — ${revisionNote}`, resourceType: 'video', resourceId: video.id });
    showToast(`Đã gửi yêu cầu sửa lại tới BTV`, 'warning');
    setRevisionModal(false);
    navigate('/dashboard');
  };

  const doAddComment = () => {
    if (!commentText.trim()) { showToast('Vui lòng nhập nội dung comment', 'error'); return; }
    const tsMatch = commentText.match(/\b(\d{1,2}:\d{2})\b/);
    addComment(video.id, {
      id: Date.now(),
      videoId: video.id,
      user: currentUser,
      text: commentText,
      timestamp: tsMatch?.[1],
      resolved: false,
      createdAt: 'Vừa xong',
    });
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Comment tại ${tsMatch?.[1] ?? '—'} — "${commentText.substring(0, 40)}"`, resourceType: 'video', resourceId: video.id });
    setCommentText('');
    showToast('Đã gửi comment', 'success');
  };

  const doResolve = (cId: number) => {
    resolveComment(video.id, cId);
    showToast('Đã đánh dấu comment là đã xử lý', 'success');
  };

  // Topbar actions
  const backBtn = <Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>;
  const reuploadBtn = (role === 'btv' && (video.status === 'needs_revision' || video.status === 'rejected')) ? (
    <Button variant="primary" size="sm" icon={<Upload size={13} />} onClick={() => navigate(`/upload?reupload=${video.id}`)}>
      Re-upload v{video.currentVersion + 1}
    </Button>
  ) : null;

  return (
    <div className="flex flex-col h-full">
      <TopBar title={video.title} subtitle={`${video.fileId} · v${video.currentVersion}`}
        actions={<div className="flex gap-2">{backBtn}{reuploadBtn}</div>} />

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
                <div className={`aspect-video bg-gradient-to-br ${video.thumbGradient} relative flex items-center justify-center group cursor-pointer`}
                  onClick={() => showToast('Trình phát video sẽ được tích hợp trong bản production', 'info')}>
                  <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play size={24} className="text-white ml-1" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/20 rounded-full">
                      <div className="w-1/3 h-full bg-white rounded-full" />
                    </div>
                    <span className="text-white text-xs font-mono bg-black/40 px-1.5 rounded">
                      {video.versions[currentVersionNum - 1]?.duration ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-3">{video.title}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm mb-3">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
                      <span className="text-gray-400">BTV:</span>
                      <Avatar name={video.btv.name} initials={video.btv.initials} bg={video.btv.avatarBg} color={video.btv.avatarColor} size="xs" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">{video.btv.name}</span>
                    </div>
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
                  </div>

                  {/* Version switcher */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-semibold">Phiên bản:</span>
                    {video.versions.map(ver => (
                      <button key={ver.number} onClick={() => setSelectedVersion(ver.number)}
                        className={cn('font-mono text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all',
                          currentVersionNum === ver.number
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300')}>
                        v{ver.number}{ver.number === video.currentVersion ? ' (hiện tại)' : ''}
                      </button>
                    ))}
                  </div>

                  {/* Version info */}
                  {video.versions[currentVersionNum - 1] && (
                    <div className="mt-2 flex gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>Tải lên: {video.versions[currentVersionNum - 1].uploadedAt}</span>
                      <span>Kích thước: {video.versions[currentVersionNum - 1].fileSize}</span>
                    </div>
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

              {/* Audit history */}
              <Card className={cn('overflow-hidden', activeTab !== 'history' && 'hidden lg:block')}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <History size={14} className="text-gray-400" />
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Lịch sử duyệt</span>
                  <span className="ml-auto text-xs text-gray-400">{video.history.length} bước</span>
                </div>
                <div>
                  {video.history.map((entry, i) => (
                    <div key={entry.id}
                      className={cn('flex items-start gap-3 px-4 py-3 text-sm', i < video.history.length - 1 && 'border-b border-gray-100 dark:border-gray-800')}>
                      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                          i === video.history.length - 1 ? 'bg-blue-600 text-white' : 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400')}>
                          {i === video.history.length - 1 ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                        </div>
                        {i < video.history.length - 1 && <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar name={entry.user.name} initials={entry.user.initials} bg={entry.user.avatarBg} color={entry.user.avatarColor} size="xs" />
                          <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">{entry.user.name}</span>
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-600 ml-auto">{entry.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{entry.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Action panel */}
              {role === 'reviewer' && ['pending', 'reviewing', 'needs_revision'].includes(video.status) && (
                <Card className="p-4 border-l-4 border-violet-500">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Kết luận review</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Chỉ approve khi đã resolve hết toàn bộ comments open.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="success" icon={<Send size={13} />} onClick={() => setSendFinalModal(true)}>Chuyển lên Duyệt cuối</Button>
                    <Button variant="warning" icon={<RotateCcw size={13} />} onClick={() => setRevisionModal(true)}>Yêu cầu sửa lại</Button>
                  </div>
                </Card>
              )}

              {role === 'final' && video.status === 'reviewed' && (
                <Card className="p-4 border-l-4 border-orange-500">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1">Quyết định của bạn</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">Nếu reject, sẽ gửi thông báo đến BTV và Reviewer.</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="success" icon={<CheckCircle2 size={13} />} onClick={() => setApproveModal(true)}>Approve — Xuất bản</Button>
                    <Button variant="danger" icon={<XCircle size={13} />} onClick={() => setRejectModal(true)}>Reject — Từ chối</Button>
                  </div>
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
                    <span className="text-gray-400">{vComments.filter(c => c.resolved).length} resolved</span>
                  </div>
                </div>

                {/* Comment list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {vComments.length === 0 ? (
                    <EmptyState icon={<MessageSquare size={20} />} title="Chưa có comment nào" description="Comment đầu tiên để bắt đầu review" />
                  ) : (
                    vComments.map(c => (
                      <div key={c.id} className={cn('rounded-xl border p-3 transition-all',
                        c.resolved
                          ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 opacity-60'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm')}>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name={c.user.name} initials={c.user.initials} bg={c.user.avatarBg} color={c.user.avatarColor} size="xs" />
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{c.user.name}</span>
                          {c.timestamp && (
                            <span className="font-mono text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                              {c.timestamp}
                            </span>
                          )}
                          {c.resolved && (
                            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={9} /> Đã xử lý
                            </span>
                          )}
                          <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-600">{c.createdAt}</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {c.text.replace(/@(\S+)/g, (_, m) => `@${m}`)}
                        </p>
                        {!c.resolved && (role === 'reviewer' || role === 'final') && (
                          <button onClick={() => doResolve(c.id)}
                            className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            <CheckCircle2 size={10} /> Đánh dấu đã xử lý
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Comment input */}
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
                    <span>Bạn chỉ có thể xem comments của Reviewer. Re-upload để phản hồi.</span>
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
          <Button variant="success" size="sm" icon={<CheckCircle2 size={13} />} onClick={doApprove}>Xác nhận Approve</Button>
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
          <Button variant="danger" size="sm" icon={<XCircle size={13} />} onClick={doReject}>Xác nhận Reject</Button>
        </>}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Video: <strong className="text-gray-900 dark:text-gray-100">"{video.title}"</strong></p>
        <Textarea label="Lý do từ chối *" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
          placeholder="Mô tả rõ lý do để BTV biết cần sửa gì..." className="min-h-[80px]" />
      </Modal>

      <Modal open={sendFinalModal} onClose={() => setSendFinalModal(false)}
        title="📤 Chuyển lên Duyệt cuối" size="sm" titleColor="text-violet-600 dark:text-violet-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setSendFinalModal(false)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<Send size={13} />} onClick={doSendFinal}>Chuyển lên Duyệt cuối</Button>
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
          <Button variant="warning" size="sm" icon={<RotateCcw size={13} />} onClick={doRequestRevision}>Gửi yêu cầu sửa</Button>
        </>}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Video: <strong className="text-gray-900 dark:text-gray-100">"{video.title}"</strong></p>
        <Textarea label="Tóm tắt yêu cầu sửa *" value={revisionNote} onChange={e => setRevisionNote(e.target.value)}
          placeholder="Mô tả ngắn gọn cần sửa gì..." className="min-h-[70px]" />
      </Modal>
    </div>
  );
}
