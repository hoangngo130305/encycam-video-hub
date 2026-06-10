import { useState } from 'react';
import { Download, Search, FileText, Video, User, Settings } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import TopBar from '../../components/layout/TopBar';
import { Avatar, Button, Card } from '../../components/ui';
import { cn } from '../../lib/utils';

const TYPE_ICONS = {
  video: Video,
  user: User,
  system: Settings,
};

const TYPE_COLORS = {
  video: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  user: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  system: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

export default function AuditLogPage() {
  const { auditLog, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const filtered = auditLog.filter(entry => {
    const matchSearch = !search || entry.action.toLowerCase().includes(search.toLowerCase()) || entry.user.name.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || entry.resourceType === typeFilter;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = () => {
    const header = 'Thời gian,Người dùng,Hành động,Loại\n';
    const rows = filtered.map(e => `"${e.timestamp}","${e.user.name}","${e.action}","${e.resourceType}"`).join('\n');
    const blob = new Blob(['﻿' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'encycam_audit_log.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Đã export Audit Log CSV', 'success');
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Audit Log" subtitle={`${filtered.length} bản ghi`}
        actions={<Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportCSV}>Export CSV</Button>} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo hành động, người dùng..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
          </div>
          <div className="flex gap-1.5">
            {[{ value: '', label: 'Tất cả' }, { value: 'video', label: 'Video' }, { value: 'user', label: 'User' }, { value: 'system', label: 'System' }].map(f => (
              <button key={f.value} onClick={() => { setTypeFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  typeFilter === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Log table */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <FileText size={14} className="text-gray-400" />
            <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Lịch sử hoạt động</span>
            <span className="ml-auto text-xs text-gray-400">{filtered.length} bản ghi</span>
          </div>

          {paginated.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-500">Không có bản ghi nào phù hợp</div>
          ) : (
            <div>
              {paginated.map((entry, i) => {
                const Icon = TYPE_ICONS[entry.resourceType];
                return (
                  <div key={entry.id}
                    className={cn('flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors', i < paginated.length - 1 && 'border-b border-gray-100 dark:border-gray-800')}>
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_COLORS[entry.resourceType])}>
                      <Icon size={12} />
                    </div>
                    <div className="flex-shrink-0">
                      <Avatar name={entry.user.name} initials={entry.user.initials} bg={entry.user.avatarBg} color={entry.user.avatarColor} size="xs" />
                    </div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0 w-24 truncate">{entry.user.name}</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{entry.action}</span>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 flex-shrink-0">{entry.timestamp}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Trang {page}/{totalPages} · {filtered.length} bản ghi
            </span>
            <div className="flex gap-1">
              <Button variant="secondary" size="xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trước</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={cn('w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                      pg === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700')}>
                    {pg}
                  </button>
                );
              })}
              <Button variant="secondary" size="xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sau</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
