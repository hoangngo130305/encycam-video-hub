import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Video, Search, Filter } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { saleVideoService } from '../../services/saleVideoService';
import { saleProjectService } from '../../services/saleProjectService';
import TopBar from '../../components/layout/TopBar';
import { StatusBadge, Card, EmptyState, Input } from '../../components/ui';
import type { SaleVideo, SaleProject } from '../../types';

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

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ review' },
  { value: 'reviewing', label: 'Đang review' },
  { value: 'needs_revision', label: 'Cần sửa' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Từ chối' },
];

export default function SaleVideoQueuePage() {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isManager = currentUser?.role === 'sale_manager' || currentUser?.role === 'admin';

  const [videos, setVideos] = useState<SaleVideo[]>([]);
  const [projects, setProjects] = useState<SaleProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activeStatus = searchParams.get('status') ?? '';
  const activeProject = searchParams.get('projectId') ? Number(searchParams.get('projectId')) : '';

  useEffect(() => {
    setLoading(true);
    const params: { status?: string; projectId?: number } = {};
    if (activeStatus) params.status = activeStatus;
    if (activeProject) params.projectId = Number(activeProject);

    const fetches: Promise<unknown>[] = [saleVideoService.list(params)];
    if (isManager) fetches.push(saleProjectService.list());

    Promise.all(fetches).then(([vids, projs]) => {
      setVideos(vids as SaleVideo[]);
      if (projs) setProjects(projs as SaleProject[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeStatus, activeProject, isManager]);

  const filtered = search
    ? videos.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.uploader?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : videos;

  const setStatus = (s: string) => {
    const p = new URLSearchParams(searchParams);
    if (s) p.set('status', s); else p.delete('status');
    setSearchParams(p);
  };

  const setProject = (id: number | '') => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set('projectId', String(id)); else p.delete('projectId');
    setSearchParams(p);
  };

  const title = isManager ? 'Video của Sale' : 'Video của tôi';
  const subtitle = loading ? 'Đang tải…' : `${filtered.length} video`;

  return (
    <div className="flex flex-col h-full">
      <TopBar title={title} subtitle={subtitle} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filters */}
        <div className="px-4 lg:px-6 py-3 border-b border-gray-100 dark:border-gray-800 space-y-2">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeStatus === tab.value
                    ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'
                    : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Project filter */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Tìm video..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftIcon={<Search size={13} className="text-gray-400" />}
              />
            </div>
            {isManager && projects.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-gray-400 flex-shrink-0" />
                <select
                  value={activeProject}
                  onChange={e => setProject(e.target.value ? Number(e.target.value) : '')}
                  className="text-xs px-2.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-yellow-500 cursor-pointer"
                >
                  <option value="">Tất cả project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Video size={24} />}
              title="Không có video nào"
              description={activeStatus ? `Không có video với trạng thái này.` : 'Chưa có video nào được upload.'}
            />
          ) : (
            <Card>
              {filtered.map((v, i, arr) => (
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
                      {isManager && (
                        <>
                          <span className="text-xs text-gray-500 dark:text-gray-500">{v.uploader?.name ?? '—'}</span>
                          <span className="text-gray-300 dark:text-gray-700">·</span>
                        </>
                      )}
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">{v.saleProject?.name ?? '—'}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs font-mono text-violet-600 dark:text-violet-400">v{v.currentVersion}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">{timeAgo(v.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
