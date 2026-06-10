import { useNavigate } from 'react-router-dom';
import { Video, Clock, CheckCircle2, XCircle, Users, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import TopBar from '../../components/layout/TopBar';
import { StatCard, StatusBadge, Avatar, Button, Card } from '../../components/ui';
import type { VideoStatus } from '../../types';

export default function AdminOverviewPage() {
  const { videos, users, auditLog } = useAppStore();
  const navigate = useNavigate();

  const statusGroups = {
    pending: videos.filter(v => v.status === 'pending'),
    reviewing: videos.filter(v => v.status === 'reviewing'),
    reviewed: videos.filter(v => v.status === 'reviewed'),
    approved: videos.filter(v => v.status === 'approved'),
    rejected: videos.filter(v => v.status === 'rejected'),
    needs_revision: videos.filter(v => v.status === 'needs_revision'),
  };

  const statusBars: { label: string; count: number; color: string; status: VideoStatus }[] = [
    { label: 'Pending', count: statusGroups.pending.length, color: 'bg-amber-400', status: 'pending' },
    { label: 'Reviewing', count: statusGroups.reviewing.length, color: 'bg-blue-400', status: 'reviewing' },
    { label: 'Reviewed', count: statusGroups.reviewed.length, color: 'bg-violet-400', status: 'reviewed' },
    { label: 'Approved', count: statusGroups.approved.length, color: 'bg-green-400', status: 'approved' },
    { label: 'Rejected', count: statusGroups.rejected.length, color: 'bg-red-400', status: 'rejected' },
    { label: 'Cần sửa', count: statusGroups.needs_revision.length, color: 'bg-orange-400', status: 'needs_revision' },
  ];

  const approvalRate = videos.length > 0
    ? Math.round((statusGroups.approved.length / videos.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Tổng quan hệ thống" subtitle={`${videos.length} video · ${users.length} user`}
        actions={<Button variant="secondary" size="sm" icon={<Users size={13} />} onClick={() => navigate('/admin/users')}>Quản lý user</Button>} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Tổng video" value={videos.length} sub="trên hệ thống"
            icon={<Video size={15} />} color="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" />
          <StatCard label="Approved" value={statusGroups.approved.length} sub="tháng này"
            icon={<CheckCircle2 size={15} />} color="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" />
          <StatCard label="Tỉ lệ approve" value={`${approvalRate}%`} sub="accuracy"
            icon={<TrendingUp size={15} />} color="bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400" />
          <StatCard label="Users active" value={users.filter(u => !u.locked).length} sub={`${users.filter(u => u.locked).length} bị khoá`}
            icon={<Users size={15} />} color="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400" />
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
                    style={{ width: `${videos.length > 0 ? (item.count / videos.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 w-5 text-right">{item.count}</span>
              </div>
            ))}
          </Card>

          {/* Alerts */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} className="text-orange-500" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Cảnh báo cần xử lý</span>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">Timeout 7 ngày</div>
                <div className="text-xs text-orange-600 dark:text-orange-500">
                  "Top 5 ống kính kit 2025" — Phạm Long chưa action
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Timeout 3 ngày</div>
                <div className="text-xs text-amber-600 dark:text-amber-500">
                  "Hướng dẫn chụp ảnh chân dung" — Email nhắc đã gửi
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Cleanup thành công</div>
                <div className="text-xs text-green-600 dark:text-green-500">
                  3 file cũ đã xóa · tiết kiệm 4.2 GB · 02:00 hôm nay
                </div>
              </div>
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
              {auditLog.slice(0, 6).map(entry => (
                <div key={entry.id} className="flex items-start gap-2.5">
                  <Avatar name={entry.user.name} initials={entry.user.initials} bg={entry.user.avatarBg} color={entry.user.avatarColor} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug line-clamp-2">{entry.action}</p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{entry.timestamp}</span>
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
            {videos.slice(0, 5).map((v, i) => (
              <div key={v.id} onClick={() => navigate(`/videos/${v.id}`)}
                className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${i < Math.min(videos.length, 5) - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <div className={`w-10 h-7 rounded-lg bg-gradient-to-br ${v.thumbGradient} flex-shrink-0 flex items-center justify-center`}>
                  <Video size={11} className="text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{v.title}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Avatar name={v.btv.name} initials={v.btv.initials} bg={v.btv.avatarBg} color={v.btv.avatarColor} size="xs" />
                    <span className="text-xs text-gray-500 dark:text-gray-500">{v.btv.name}</span>
                  </div>
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
