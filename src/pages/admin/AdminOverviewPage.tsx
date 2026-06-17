import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, CheckCircle2, Users, AlertTriangle, BarChart3, TrendingUp, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { dashboardService, type DashboardData } from '../../services/dashboardService';
import { auditService } from '../../services/auditService';
import TopBar from '../../components/layout/TopBar';
import { StatCard, StatusBadge, Avatar, Button, Card } from '../../components/ui';
import type { AuditEntry, VideoStatus } from '../../types';

const DJANGO_ADMIN_URL = `${import.meta.env.VITE_ADMIN_BASE ?? 'http://127.0.0.1:8000'}/admin/`;

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function AdminOverviewPage() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      dashboardService.get(),
      auditService.list({ page: '1' }),
    ]).then(([dash, audit]) => {
      setData(dash);
      setRecentAudit(audit.results.slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [currentUser]);

  const stats = data?.stats ?? {};
  const statusDist = data?.statusDistribution ?? {};
  const recentVideos = (data?.recentVideos ?? []);
  const totalVideos = (stats.totalVideos ?? 0) as number;

  const statusBars: { label: string; count: number; color: string; status: VideoStatus }[] = [
    { label: 'Pending',   count: (statusDist.pending ?? 0) as number,     color: 'bg-amber-400',  status: 'pending' },
    { label: 'Reviewing', count: (statusDist.reviewing ?? 0) as number,   color: 'bg-blue-400',   status: 'reviewing' },
    { label: 'Reviewed',  count: (statusDist.reviewed ?? 0) as number,    color: 'bg-violet-400', status: 'reviewed' },
    { label: 'Approved',  count: (statusDist.approved ?? 0) as number,    color: 'bg-green-400',  status: 'approved' },
    { label: 'Rejected',  count: (statusDist.rejected ?? 0) as number,    color: 'bg-red-400',    status: 'rejected' },
    { label: 'Cần sửa',  count: (statusDist.needsRevision ?? 0) as number, color: 'bg-orange-400', status: 'needs_revision' },
  ];

  const approvalRate = totalVideos > 0
    ? Math.round(((statusDist.approved as number ?? 0) / totalVideos) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Tổng quan hệ thống" subtitle="Đang tải..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Tổng quan hệ thống"
        subtitle={`${totalVideos} video · ${(stats.totalUsers ?? 0)} user`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Users size={13} />} onClick={() => navigate('/admin/users')}>Quản lý user</Button>
            <Button variant="primary" size="sm" icon={<ExternalLink size={13} />} onClick={() => window.open(DJANGO_ADMIN_URL, '_blank')}>Django Admin</Button>
          </div>
        } />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Tổng video" value={totalVideos} sub="trên hệ thống"
            icon={<Video size={15} />} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/videos')} />
          <StatCard label="Approved" value={(statusDist.approved ?? 0) as number} sub="tháng này"
            icon={<CheckCircle2 size={15} />} color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" />
          <StatCard label="Tỉ lệ approve" value={`${approvalRate}%`} sub="accuracy"
            icon={<TrendingUp size={15} />} color="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400" />
          <StatCard label="Users active" value={(stats.activeUsers ?? 0) as number} sub={`${(stats.totalUsers ?? 0) as number} tổng`}
            icon={<Users size={15} />} color="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
            onClick={() => navigate('/admin/users')} />
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Status distribution */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} className="text-gray-400" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Phân bố trạng thái</span>
            </div>
            {statusBars.map(item => (
              <div key={item.label} className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-500 w-20 flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/videos?status=${item.status}`)}>
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${totalVideos > 0 ? (item.count / totalVideos) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 w-5 text-right">{item.count}</span>
              </div>
            ))}
          </Card>

          {/* Pending alerts */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} className="text-orange-500" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Video đang chờ</span>
            </div>
            <div className="space-y-2.5">
              {(stats.pending ?? 0) > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 cursor-pointer"
                  onClick={() => navigate('/videos?status=pending')}>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">Chờ Review</div>
                  <div className="text-xs text-amber-600 dark:text-amber-500">{(stats.pending ?? 0) as number} video chờ được review</div>
                </div>
              )}
              {(statusDist.reviewed ?? 0) > 0 && (
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 cursor-pointer"
                  onClick={() => navigate('/videos?status=reviewed')}>
                  <div className="text-xs font-bold text-violet-700 dark:text-violet-400 mb-0.5">Chờ Duyệt cuối</div>
                  <div className="text-xs text-violet-600 dark:text-violet-500">{(statusDist.reviewed ?? 0) as number} video chờ approve</div>
                </div>
              )}
              {(statusDist.needsRevision ?? 0) > 0 && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 cursor-pointer"
                  onClick={() => navigate('/videos?status=needs_revision')}>
                  <div className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-0.5">Cần sửa lại</div>
                  <div className="text-xs text-orange-600 dark:text-orange-500">{(statusDist.needsRevision ?? 0) as number} video cần BTV upload lại</div>
                </div>
              )}
              {(stats.pending ?? 0) === 0 && (statusDist.reviewed ?? 0) === 0 && (statusDist.needsRevision ?? 0) === 0 && (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="text-xs font-bold text-green-700 dark:text-green-400">Tất cả đã xử lý ✓</div>
                  <div className="text-xs text-green-600 dark:text-green-500">Không có video nào đang chờ</div>
                </div>
              )}
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} className="text-gray-400" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Hoạt động gần đây</span>
              <button onClick={() => navigate('/admin/audit')} className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Xem tất cả
              </button>
            </div>
            <div className="space-y-3">
              {recentAudit.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Chưa có hoạt động nào</p>
              ) : recentAudit.map(entry => (
                <div key={entry.id} className="flex items-start gap-2.5">
                  {entry.user && (
                    <Avatar name={entry.user.name} initials={entry.user.initials ?? entry.user.name.substring(0, 2).toUpperCase()}
                      bg={entry.user.avatarBg ?? '#e5e7eb'} color={entry.user.avatarColor ?? '#374151'} size="xs" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{entry.action}</p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{timeAgo(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent videos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Video gần đây</h2>
            <button onClick={() => navigate('/videos')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Xem tất cả →</button>
          </div>
          <Card className="overflow-hidden">
            {recentVideos.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">Chưa có video nào</div>
            ) : recentVideos.slice(0, 5).map((v, i) => (
              <div key={v.id} onClick={() => navigate(`/videos/${v.id}`)}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${i < Math.min(recentVideos.length, 5) - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <div className={`w-10 h-7 rounded-lg bg-gradient-to-br ${v.thumbGradient} flex-shrink-0 flex items-center justify-center`}>
                  <Video size={11} className="text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{v.title}</div>
                  {v.btv && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Avatar name={v.btv.name} initials={v.btv.initials} bg={v.btv.avatarBg} color={v.btv.avatarColor} size="xs" />
                      <span className="text-xs text-gray-500 dark:text-gray-500">{v.btv.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-violet-600 dark:text-violet-400">v{v.currentVersion}</span>
                  <StatusBadge status={v.status as VideoStatus} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
