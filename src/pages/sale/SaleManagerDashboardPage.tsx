import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video, Clock, CheckCircle2, XCircle, AlertTriangle,
  FolderOpen, Users, Eye,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { dashboardService } from '../../services/dashboardService';
import { saleVideoService } from '../../services/saleVideoService';
import TopBar from '../../components/layout/TopBar';
import { StatCard, StatusBadge, Avatar, Button, Card, EmptyState } from '../../components/ui';
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

export default function SaleManagerDashboardPage() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pendingVideos, setPendingVideos] = useState<SaleVideo[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ id: number; user?: { name: string; initials: string; avatarBg: string; avatarColor: string }; action: string; timestamp: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      dashboardService.get(),
      saleVideoService.list({ status: 'pending' }),
    ]).then(([dash, pending]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = dash as any;
      setStats(d.stats ?? {});
      setRecentActivity(d.recentActivity ?? []);
      setPendingVideos(pending.slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return null;

  const name = currentUser.name.split(' ').slice(-1)[0];

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Dashboard Sale Manager" subtitle="Đang tải..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Dashboard Sale Manager"
        subtitle={`Xin chào, ${name} — ${stats.pending ?? 0} video đang chờ review`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<FolderOpen size={13} />} onClick={() => navigate('/sale-manager/projects')}>
              Projects
            </Button>
            <Button variant="secondary" size="sm" icon={<Users size={13} />} onClick={() => navigate('/sale-manager/users')}>
              Sale accounts
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Chờ review" value={stats.pending ?? 0} sub="cần xử lý"
            icon={<Clock size={15} />}
            color="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            onClick={() => navigate('/sale-videos?status=pending')}
          />
          <StatCard
            label="Đang review" value={stats.reviewing ?? 0} sub="đang xem"
            icon={<Eye size={15} />}
            color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            onClick={() => navigate('/sale-videos?status=reviewing')}
          />
          <StatCard
            label="Cần sửa" value={stats.needsRevision ?? 0} sub="chờ re-upload"
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
          <StatCard
            label="Từ chối" value={stats.rejected ?? 0} sub="tháng này"
            icon={<XCircle size={15} />}
            color="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
            onClick={() => navigate('/sale-videos?status=rejected')}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pending queue */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Hàng chờ review ({pendingVideos.length})
              </h2>
              <button
                onClick={() => navigate('/sale-videos?status=pending')}
                className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 hover:underline"
              >
                Xem tất cả →
              </button>
            </div>
            <Card>
              {pendingVideos.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 size={22} />}
                  title="Không có video nào chờ review"
                  description="Tất cả video đã được xử lý!"
                />
              ) : pendingVideos.map((v, i, arr) => (
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
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 dark:text-gray-500">{v.uploader?.name ?? '—'}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{v.saleProject?.name ?? '—'}</span>
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
            {/* Quick actions */}
            <Card className="p-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3">Thao tác nhanh</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/sale-manager/projects')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 transition-colors text-left"
                >
                  <FolderOpen size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quản lý Projects</div>
                    <div className="text-xs text-gray-500">Tạo project, gán Sale</div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/sale-manager/users')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 hover:bg-pink-100 dark:hover:bg-pink-950/40 transition-colors text-left"
                >
                  <Users size={16} className="text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tài khoản Sale</div>
                    <div className="text-xs text-gray-500">Tạo và quản lý Sale</div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/sale-videos')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 transition-colors text-left"
                >
                  <Video size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tất cả video</div>
                    <div className="text-xs text-gray-500">Xem & review video của Sale</div>
                  </div>
                </button>
              </div>
            </Card>

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
