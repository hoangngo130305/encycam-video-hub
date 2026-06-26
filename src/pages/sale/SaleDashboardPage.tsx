import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, CheckCircle2, XCircle, AlertTriangle, Upload, Eye, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { dashboardService } from '../../services/dashboardService';
import { saleVideoService } from '../../services/saleVideoService';
import TopBar from '../../components/layout/TopBar';
import { StatCard, StatusBadge, Button, Card, EmptyState, Avatar } from '../../components/ui';
import type { SaleVideo } from '../../types';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function SaleDashboardPage() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentVideos, setRecentVideos] = useState<SaleVideo[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [recentActivity, setRecentActivity] = useState<{ id: number; user?: { name: string; initials: string; avatarBg: string; avatarColor: string }; action: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      dashboardService.get(),
      saleVideoService.list(),
    ]).then(([dash, videos]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = dash as any;
      setStats(d.stats ?? {});
      setRecentActivity(d.recentActivity ?? []);
      const sorted = [...videos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRecentVideos(sorted.slice(0, 5));
      if (sorted[0]?.saleProject?.name) setProjectName(sorted[0].saleProject.name);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return null;
  const name = currentUser.name.split(' ').slice(-1)[0];

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Dashboard" subtitle="Đang tải..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Dashboard"
        subtitle={`Xin chào, ${name} ${projectName ? `· Project: ${projectName}` : ''}`}
        actions={
          <Button variant="primary" size="sm" icon={<Upload size={13} />} onClick={() => navigate('/sale/upload')}>
            Upload video
          </Button>
        }
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Tổng video" value={stats.total ?? 0} sub="của tôi"
            icon={<Video size={15} />}
            color="bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400"
            onClick={() => navigate('/sale-videos')}
          />
          <StatCard
            label="Đang review" value={stats.reviewing ?? 0} sub="chờ phản hồi"
            icon={<Eye size={15} />}
            color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/sale-videos?status=reviewing')}
          />
          <StatCard
            label="Cần sửa" value={stats.needsRevision ?? 0} sub="re-upload ngay"
            icon={<AlertTriangle size={15} />}
            color="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
            onClick={() => navigate('/sale-videos?status=needs_revision')}
          />
          <StatCard
            label="Đã approve" value={stats.approved ?? 0} sub="tháng này"
            icon={<CheckCircle2 size={15} />}
            color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400"
            onClick={() => navigate('/sale-videos?status=approved')}
          />
        </div>

        {/* Cần sửa alert */}
        {(stats.needsRevision ?? 0) > 0 && (
          <div
            onClick={() => navigate('/sale-videos?status=needs_revision')}
            className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 flex items-center gap-3 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
          >
            <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                Bạn có {stats.needsRevision} video cần sửa lại
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-400">Nhấn để xem và re-upload</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent videos */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Video gần đây</h2>
              <button onClick={() => navigate('/sale-videos')} className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline">
                Xem tất cả →
              </button>
            </div>
            <Card>
              {recentVideos.length === 0 ? (
                <EmptyState
                  icon={<Video size={22} />}
                  title="Chưa có video nào"
                  description="Upload video đầu tiên của bạn!"
                  action={<Button variant="primary" size="sm" icon={<Upload size={13} />} onClick={() => navigate('/sale/upload')}>Upload ngay</Button>}
                />
              ) : recentVideos.map((v, i, arr) => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/sale-videos/${v.id}`)}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                >
                  <div className={`w-12 h-9 rounded-lg bg-gradient-to-br ${v.thumbGradient} flex-shrink-0 flex items-center justify-center`}>
                    <Video size={14} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{v.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-violet-600 dark:text-violet-400">v{v.currentVersion}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">{timeAgo(v.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Project info */}
            {projectName && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen size={15} className="text-yellow-500" />
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Project của tôi</span>
                </div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{projectName}</p>
                <p className="text-xs text-gray-500 mt-1">Video bạn upload sẽ thuộc project này</p>
              </Card>
            )}

            {/* Recent activity */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} className="text-gray-400" />
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Hoạt động gần đây</span>
              </div>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">Chưa có hoạt động nào</p>
                ) : recentActivity.slice(0, 5).map(entry => (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <Avatar
                      name={entry.user?.name ?? '?'}
                      initials={entry.user?.initials ?? '?'}
                      bg={entry.user?.avatarBg ?? '#e5e7eb'}
                      color={entry.user?.avatarColor ?? '#374151'}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{entry.action}</p>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{timeAgo(entry.timestamp)}</span>
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
