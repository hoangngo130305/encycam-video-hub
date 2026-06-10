import { useNavigate } from 'react-router-dom';
import { Video, Clock, CheckCircle2, XCircle, AlertTriangle, Upload, Eye, Gavel, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import TopBar from '../components/layout/TopBar';
import { StatCard, StatusBadge, Avatar, Button, Card, EmptyState } from '../components/ui';

export default function DashboardPage() {
  const { currentUser, videos, users, auditLog } = useAppStore();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const role = currentUser.role;

  // Stats
  const myVideos = role === 'btv' ? videos.filter(v => v.btv.id === currentUser.id) : videos;
  const pending = myVideos.filter(v => v.status === 'pending');
  const reviewing = myVideos.filter(v => v.status === 'reviewing');
  const reviewed = myVideos.filter(v => v.status === 'reviewed');
  const approved = myVideos.filter(v => v.status === 'approved');
  const rejected = myVideos.filter(v => v.status === 'rejected');
  const needsRevision = myVideos.filter(v => v.status === 'needs_revision');

  const topBarActions: Record<string, React.ReactNode> = {
    btv: <Button variant="primary" size="sm" icon={<Upload size={13} />} onClick={() => navigate('/upload')}>Upload video</Button>,
    admin: <Button variant="secondary" size="sm" icon={<Users size={13} />} onClick={() => navigate('/admin/users')}>Quản lý user</Button>,
  };

  const titles: Record<string, { title: string; sub: string }> = {
    btv: { title: 'Dashboard', sub: `Xin chào, ${currentUser.name.split(' ').slice(-1)[0]} 👋` },
    reviewer: { title: 'Hàng chờ Review', sub: `${reviewing.length + pending.length} video cần xử lý` },
    final: { title: 'Chờ Duyệt cuối', sub: `${reviewed.length} video đang chờ quyết định` },
    admin: { title: 'Tổng quan hệ thống', sub: `${videos.length} video · ${users.length} user` },
  };

  const t = titles[role] ?? titles.btv;

  return (
    <div className="flex flex-col h-full">
      <TopBar title={t.title} subtitle={t.sub} actions={topBarActions[role]}
        onMenuClick={() => document.querySelector('[data-menu-trigger]')?.dispatchEvent(new MouseEvent('click'))} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {role === 'btv' && <>
            <StatCard label="Tổng video" value={myVideos.length} sub="của tôi"
              icon={<Video size={15} />} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
              onClick={() => navigate('/videos')} />
            <StatCard label="Đang review" value={reviewing.length} sub="chờ phản hồi"
              icon={<Eye size={15} />} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
              onClick={() => navigate('/videos?status=reviewing')} />
            <StatCard label="Cần sửa" value={needsRevision.length} sub="comment mới"
              icon={<AlertTriangle size={15} />} color="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
              onClick={() => navigate('/videos?status=needs_revision')} />
            <StatCard label="Đã approve" value={approved.length} sub="tháng này"
              icon={<CheckCircle2 size={15} />} color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400"
              onClick={() => navigate('/videos?status=approved')} />
          </>}

          {role === 'reviewer' && <>
            <StatCard label="Chờ review" value={pending.length} sub="video mới"
              icon={<Clock size={15} />} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" />
            <StatCard label="Đang xử lý" value={reviewing.length} sub="của tôi"
              icon={<Eye size={15} />} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" />
            <StatCard label="Đã reviewed" value={reviewed.length + approved.length} sub="tháng này"
              icon={<CheckCircle2 size={15} />} color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" />
            <StatCard label="Sắp timeout" value={1} sub="còn 8 tiếng"
              icon={<AlertTriangle size={15} />} color="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" />
          </>}

          {role === 'final' && <>
            <StatCard label="Chờ approve" value={reviewed.length} sub="cần xử lý"
              icon={<Gavel size={15} />} color="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" />
            <StatCard label="Đã approve" value={approved.length} sub="tháng này"
              icon={<CheckCircle2 size={15} />} color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" />
            <StatCard label="Đã reject" value={rejected.length} sub="tháng này"
              icon={<XCircle size={15} />} color="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" />
            <StatCard label="TB thời gian" value="1.2" sub="ngày/video"
              icon={<TrendingUp size={15} />} color="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400" />
          </>}

          {role === 'admin' && <>
            <StatCard label="Tổng video" value={videos.length} sub="trên hệ thống"
              icon={<Video size={15} />} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" />
            <StatCard label="Pending" value={pending.length} sub="chờ xử lý"
              icon={<Clock size={15} />} color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" />
            <StatCard label="Approved" value={approved.length} sub="tháng này"
              icon={<CheckCircle2 size={15} />} color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" />
            <StatCard label="Users" value={users.filter(u => !u.locked).length} sub="active"
              icon={<Users size={15} />} color="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400" />
          </>}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video queue */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {role === 'btv' ? 'Video gần đây' :
                 role === 'reviewer' ? 'Hàng chờ review' :
                 role === 'final' ? 'Chờ duyệt cuối' :
                 'Tất cả video'}
              </h2>
              <button onClick={() => navigate('/videos')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Xem tất cả →</button>
            </div>
            <Card>
              {(role === 'btv' ? myVideos.slice(0, 5) :
                role === 'reviewer' ? videos.filter(v => ['pending','reviewing','needs_revision'].includes(v.status)).slice(0, 5) :
                role === 'final' ? videos.filter(v => v.status === 'reviewed').slice(0, 5) :
                videos.slice(0, 6)
              ).map((v, i, arr) => (
                <div key={v.id} onClick={() => navigate(`/videos/${v.id}`)}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                  {/* Thumbnail */}
                  <div className={`w-12 h-9 rounded-lg bg-gradient-to-br ${v.thumbGradient} flex-shrink-0 flex items-center justify-center`}>
                    <Video size={14} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{v.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-500">{v.btv.name}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs font-mono text-violet-600 dark:text-violet-400">v{v.currentVersion}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">{v.updatedAt}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
              {(role === 'final' ? videos.filter(v => v.status === 'reviewed') : []).length === 0 && role === 'final' && (
                <EmptyState icon={<CheckCircle2 size={22} />} title="Không có video chờ duyệt"
                  description="Tất cả video đã được xử lý!" />
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Admin: Bar chart */}
            {role === 'admin' && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={15} className="text-gray-400" />
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Phân bố trạng thái</span>
                </div>
                {[
                  { label: 'Pending', count: pending.length, total: videos.length, color: 'bg-amber-400' },
                  { label: 'Reviewing', count: reviewing.length, total: videos.length, color: 'bg-blue-400' },
                  { label: 'Reviewed', count: reviewed.length, total: videos.length, color: 'bg-violet-400' },
                  { label: 'Approved', count: approved.length, total: videos.length, color: 'bg-green-400' },
                  { label: 'Rejected', count: rejected.length, total: videos.length, color: 'bg-red-400' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500 w-16 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 w-4 text-right">{item.count}</span>
                  </div>
                ))}
              </Card>
            )}

            {/* Recent activity / audit */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-gray-400" />
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Hoạt động gần đây</span>
              </div>
              <div className="space-y-3">
                {auditLog.slice(0, 5).map(entry => (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <Avatar name={entry.user.name} initials={entry.user.initials}
                      bg={entry.user.avatarBg} color={entry.user.avatarColor} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{entry.action}</p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{entry.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
