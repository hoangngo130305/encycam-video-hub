import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, MessageSquare, CheckCircle2, XCircle, Upload, AtSign, Clock, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { notificationService } from '../services/notificationService';
import TopBar from '../components/layout/TopBar';
import { Button, Card, EmptyState } from '../components/ui';
import { cn } from '../lib/utils';
import type { Notification } from '../types';

const NOTIF_ICONS: Record<Notification['type'], React.ElementType> = {
  comment: MessageSquare,
  approve: CheckCircle2,
  reject: XCircle,
  upload: Upload,
  mention: AtSign,
  timeout: AlertTriangle,
  system: Info,
};

const NOTIF_COLORS: Record<Notification['type'], string> = {
  comment: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  approve: 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400',
  reject: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  upload: 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  mention: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  timeout: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  system: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const { currentUser, notifications, setNotifications, markAllRead, markOneRead, unreadCount, showToast } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    notificationService.list()
      .then(notifs => setNotifications(currentUser.role, notifs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser, setNotifications]);

  if (!currentUser) return null;

  const role = currentUser.role;
  const notifs = notifications[role] ?? [];
  const unread = unreadCount(role);

  const doMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      markAllRead(role);
    } catch {
      showToast('Không thể đánh dấu đã đọc', 'error');
    }
  };

  const doMarkOneRead = async (n: Notification) => {
    if (!n.read) {
      try {
        await notificationService.markRead(n.id);
        markOneRead(role, n.id);
      } catch { /* silent */ }
    }
    if (n.videoId) navigate(`/videos/${n.videoId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Thông báo" subtitle={unread > 0 ? `${unread} chưa đọc` : 'Tất cả đã đọc'}
        actions={unread > 0 ? (
          <Button variant="ghost" size="sm" icon={<CheckCheck size={13} />} onClick={doMarkAllRead}>
            Đánh dấu đã đọc tất cả
          </Button>
        ) : undefined} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifs.length === 0 ? (
            <EmptyState icon={<Bell size={24} />} title="Không có thông báo nào"
              description="Bạn sẽ nhận thông báo khi có video mới, comment, hoặc cập nhật trạng thái" />
          ) : (
            notifs.map(n => {
              const Icon = NOTIF_ICONS[n.type] ?? Info;
              return (
                <Card key={n.id}
                  onClick={() => doMarkOneRead(n)}
                  className={cn('p-4 cursor-pointer hover:shadow-md transition-all',
                    !n.read && 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10')}>
                  <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', NOTIF_COLORS[n.type] ?? NOTIF_COLORS.system)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{n.title}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                          <span className="text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap">
                            {n.createdAt ? timeAgo(n.createdAt) : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: n.message }} />
                      {n.videoTitle && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          <Clock size={9} /> {n.videoTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
