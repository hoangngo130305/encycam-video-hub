import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Video, Upload, Eye, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import TopBar from '../components/layout/TopBar';
import { VideoFilterBar } from '../components/VideoFilterBar';
import { StatusBadge, Avatar, Button, Card, EmptyState } from '../components/ui';
import type { VideoStatus } from '../types';

/**
 * Filter mapping from filter ID to video statuses
 */
const FILTER_STATUS_MAP: Record<string, VideoStatus[]> = {
  all: ['pending', 'reviewing', 'reviewed', 'approved', 'rejected', 'needs_revision'],
  pending: ['pending'],
  approved: ['approved'],
  needs_revision: ['needs_revision'],
  rejected: ['rejected'],
};

export default function VideoListPage() {
  const { currentUser, videos } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? 'all');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive filter UI
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!currentUser) return null;

  const role = currentUser.role;

  // Filter by role visibility
  let visibleVideos = videos;
  if (role === 'btv') visibleVideos = videos.filter(v => v.btv.id === currentUser.id);
  else if (role === 'reviewer') visibleVideos = videos.filter(v => ['pending', 'reviewing', 'reviewed', 'needs_revision'].includes(v.status));

  // Apply filters using memoization for performance
  const filtered = useMemo(() => {
    return visibleVideos.filter(v => {
      // Get the video statuses for the selected filter
      const allowedStatuses = FILTER_STATUS_MAP[statusFilter] || FILTER_STATUS_MAP.all;
      const matchStatus = allowedStatuses.includes(v.status);
      const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.btv.name.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [visibleVideos, statusFilter, search]);

  const titleMap: Record<string, string> = {
    btv: 'Video của tôi',
    reviewer: 'Hàng chờ review',
    final: 'Tất cả video',
    admin: 'Tất cả video',
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title={titleMap[role] ?? 'Video'} subtitle={`${filtered.length} video`}
        actions={role === 'btv' ? (
          <Button variant="primary" size="sm" icon={<Upload size={13} />} onClick={() => navigate('/upload')}>
            Upload video
          </Button>
        ) : undefined} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm video, BTV..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
          </div>
          <VideoFilterBar 
            selectedFilter={statusFilter} 
            onFilterChange={setStatusFilter}
            isMobile={isMobile}
          />
        </div>

        {/* Video table */}
        {filtered.length === 0 ? (
          <EmptyState icon={<Video size={24} />} title="Không có video nào"
            description="Thử thay đổi bộ lọc hoặc upload video mới"
            action={role === 'btv' ? <Button variant="primary" size="sm" onClick={() => navigate('/upload')} icon={<Upload size={13} />}>Upload video</Button> : undefined} />
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden md:block overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Video</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ver.</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng thái</th>
                    {role !== 'btv' && <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">BTV</th>}
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reviewer</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cập nhật</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => {
                    const openComments = 0; // simplified
                    return (
                      <tr key={v.id} onClick={() => navigate(`/videos/${v.id}`)}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-7 rounded-lg bg-gradient-to-br ${v.thumbGradient} flex-shrink-0 flex items-center justify-center`}>
                              <Video size={11} className="text-white/80" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 max-w-[280px] truncate">{v.title}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-600 font-mono">{v.fileId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded">v{v.currentVersion}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={v.status as VideoStatus} /></td>
                        {role !== 'btv' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Avatar name={v.btv.name} initials={v.btv.initials} bg={v.btv.avatarBg} color={v.btv.avatarColor} size="xs" />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{v.btv.name}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          {v.reviewer ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={v.reviewer.name} initials={v.reviewer.initials} bg={v.reviewer.avatarBg} color={v.reviewer.avatarColor} size="xs" />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{v.reviewer.name}</span>
                            </div>
                          ) : <span className="text-xs text-gray-400 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 dark:text-gray-500">{v.updatedAt}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button size="xs" variant="ghost" icon={<Eye size={11} />}
                              onClick={e => { e.stopPropagation(); navigate(`/videos/${v.id}`); }}>
                              Xem
                            </Button>
                            {(v.status === 'needs_revision' || v.status === 'rejected') && role === 'btv' && (
                              <Button size="xs" variant="primary" icon={<Upload size={11} />}
                                onClick={e => { e.stopPropagation(); navigate(`/upload?reupload=${v.id}`); }}>
                                Re-upload
                              </Button>
                            )}
                            {v.status === 'pending' && role === 'reviewer' && (
                              <Button size="xs" variant="primary" icon={<ChevronRight size={11} />}
                                onClick={e => { e.stopPropagation(); navigate(`/videos/${v.id}`); }}>
                                Review
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            {/* Mobile card list */}
            <div className="md:hidden space-y-2">
              {filtered.map(v => (
                <Card key={v.id} onClick={() => navigate(`/videos/${v.id}`)} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-9 rounded-lg bg-gradient-to-br ${v.thumbGradient} flex-shrink-0 flex items-center justify-center mt-0.5`}>
                      <Video size={13} className="text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{v.title}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <StatusBadge status={v.status as VideoStatus} />
                        <span className="font-mono text-xs text-violet-600 dark:text-violet-400">v{v.currentVersion}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{v.updatedAt}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
