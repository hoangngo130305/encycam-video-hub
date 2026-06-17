import { useState, useEffect, useCallback } from 'react';
import { Download, Search, FileText, Video, User, Settings } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { auditService } from '../../services/auditService';
import TopBar from '../../components/layout/TopBar';
import { Avatar, Button, Card } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { AuditEntry } from '../../types';

const TYPE_ICONS: Record<AuditEntry['resourceType'], React.ElementType> = {
  video: Video,
  user: User,
  system: Settings,
};

const TYPE_COLORS: Record<AuditEntry['resourceType'], string> = {
  video: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  user: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  system: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'Vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditLogPage() {
  const { showToast } = useAppStore();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const fetchPage = useCallback(async (pg: number, q: string, type: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(pg) };
      if (q.trim()) params.search = q.trim();
      if (type) params.resourceType = type;
      const res = await auditService.list(params);
      setEntries(res.results);
      setTotal(res.count);
    } catch {
      showToast('Không thể tải audit log', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPage(page, search, typeFilter);
  }, [fetchPage, page, search, typeFilter]);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleType = (val: string) => { setTypeFilter(val); setPage(1); };

  const totalPages = Math.ceil(total / PER_PAGE);

  const exportCSV = async () => {
    try {
      showToast('Đang xuất CSV...', 'info');
      const blob = await auditService.exportCSV({ search: search || undefined, resourceType: typeFilter || undefined });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'encycam_audit_log.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('Đã tải xuống Audit Log CSV', 'success');
    } catch {
      showToast('Không thể export CSV', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Audit Log" subtitle={loading ? 'Đang tải...' : `${total} bản ghi`}
        actions={<Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportCSV}>Export CSV</Button>} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm theo hành động, người dùng..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
          </div>
          <div className="flex gap-1.5">
            {[
              { value: '', label: 'Tất cả' },
              { value: 'video', label: 'Video' },
              { value: 'user', label: 'User' },
              { value: 'system', label: 'System' },
            ].map(f => (
              <button key={f.value} onClick={() => handleType(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  typeFilter === f.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <FileText size={14} className="text-gray-400" />
            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Lịch sử hoạt động</span>
            <span className="ml-auto text-xs text-gray-400">{total} bản ghi</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-500">Không có bản ghi nào phù hợp</div>
          ) : (
            <div>
              {entries.map((entry, i) => {
                const resType = (entry.resourceType ?? 'system') as AuditEntry['resourceType'];
                const Icon = TYPE_ICONS[resType] ?? Settings;
                return (
                  <div key={entry.id}
                    className={cn('flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                      i < entries.length - 1 && 'border-b border-gray-100 dark:border-gray-800')}>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_COLORS[resType] ?? TYPE_COLORS.system)}>
                      <Icon size={12} />
                    </div>
                    {entry.user && (
                      <div className="flex-shrink-0">
                        <Avatar name={entry.user.name} initials={entry.user.initials ?? entry.user.name.substring(0, 2).toUpperCase()}
                          bg={entry.user.avatarBg ?? '#e5e7eb'} color={entry.user.avatarColor ?? '#374151'} size="xs" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0 w-24 truncate">
                      {entry.user?.name ?? '—'}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{entry.action}</span>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 flex-shrink-0">{timeAgo(entry.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Trang {page}/{totalPages} · {total} bản ghi
            </span>
            <div className="flex gap-1">
              <Button variant="secondary" size="xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>Trước</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={cn('w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                      pg === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700')}>
                    {pg}
                  </button>
                );
              })}
              <Button variant="secondary" size="xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>Sau</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
