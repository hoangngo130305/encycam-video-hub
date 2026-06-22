import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CloudUpload, FileVideo, X, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { videoService } from '../services/videoService';
import { categoryService } from '../services/categoryService';
import TopBar from '../components/layout/TopBar';
import { Button, Input, Textarea, Card } from '../components/ui';
import { cn } from '../lib/utils';
import type { Video } from '../types';

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export default function UploadPage() {
  const { currentUser, videos, showToast } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reuploadId = searchParams.get('reupload');
  const reuploadNum = reuploadId ? Number(reuploadId) : null;
  const [reuploadVideo, setReuploadVideo] = useState<Video | undefined>(
    reuploadNum ? videos.find(v => v.id === reuploadNum) : undefined
  );

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    categoryService.list()
      .then(list => {
        const names = list.map(c => c.name);
        setCategories(names);
        setCategory(prev => prev || names[0] || '');
      })
      .catch(() => {});
  }, []);

  const defaultCategory = reuploadVideo?.category ?? '';

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(reuploadVideo?.title ?? '');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [drag, setDrag] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch the target video from the API when the Zustand store is empty.
  // BTV can navigate here from VideoDetailPage (bypassing VideoListPage), so
  // the store may not yet contain the video they want to re-upload.
  useEffect(() => {
    if (!reuploadNum || reuploadVideo) return;
    const fromStore = videos.find(v => v.id === reuploadNum);
    if (fromStore) {
      setReuploadVideo(fromStore);
      setTitle(prev => prev || fromStore.title);
      return;
    }
    let cancelled = false;
    videoService.get(reuploadNum).then(v => {
      if (!cancelled) {
        setReuploadVideo(v);
        setTitle(prev => prev || v.title);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [reuploadNum, videos, reuploadVideo]);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.mp4')) {
      showToast('Chỉ nhận file .mp4', 'error');
      return;
    }
    if (f.size > 4 * 1024 * 1024 * 1024) {
      showToast('File quá lớn (tối đa 4 GB)', 'error');
      return;
    }
    setFile(f);
    setUploadState('selected');
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Vui lòng nhập tên video';
    if (!file) errs.file = 'Vui lòng chọn file video';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const doUpload = async () => {
    if (!validate() || !currentUser || !file) return;
    setUploadState('uploading');
    setProgress(0);

    // Animate progress during upload
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 8 + 2;
      });
    }, 300);

    const formData = new FormData();
    formData.append('file', file);
    if (!reuploadVideo) formData.append('title', title.trim());
    formData.append('category', category);
    if (notes.trim()) formData.append('notes', notes.trim());

    try {
      if (reuploadVideo) {
        await videoService.reupload(reuploadVideo.id, formData);
      } else {
        await videoService.create(formData);
      }
      clearInterval(interval);
      setProgress(100);
      setUploadState('success');
      showToast(reuploadVideo ? `Re-upload thành công! v${reuploadVideo.currentVersion + 1} đã được tạo.` : 'Upload thành công! Video đang chờ review.', 'success');
      setTimeout(() => navigate('/videos'), 1500);
    } catch (err: unknown) {
      clearInterval(interval);
      setUploadState('error');
      showToast(err instanceof Error ? err.message : 'Upload thất bại. Vui lòng thử lại.', 'error');
    }
  };

  const reset = () => {
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    setErrors({});
    if (fileRef.current) fileRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={reuploadVideo ? `Re-upload: ${reuploadVideo.title}` : 'Upload video mới'}
        subtitle={reuploadVideo ? `v${reuploadVideo.currentVersion + 1} sẽ được tạo` : 'Chỉ nhận .mp4 · Tối đa 4 GB'}
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>}
      />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Upload zone */}
          {uploadState === 'idle' || uploadState === 'selected' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
                drag ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]' :
                file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' :
                'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/10',
              )}>
              <input ref={fileRef} type="file" accept=".mp4" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {!file ? (
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto mb-4">
                    <CloudUpload size={28} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">Kéo thả file video vào đây</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">Chỉ nhận .mp4 · Tối đa 4 GB mỗi file</p>
                  <Button variant="primary" size="sm" icon={<Upload size={13} />}
                    onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                    Chọn từ máy tính
                  </Button>
                  {errors.file && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.file}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                    <FileVideo size={22} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{file.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{formatSize(file.size)}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-semibold">
                      <CheckCircle2 size={11} /> Sẵn sàng upload
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); reset(); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : uploadState === 'uploading' ? (
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                  <FileVideo size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{file?.name}</div>
                  <div className="text-xs text-gray-500">Đang upload…</div>
                </div>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{Math.floor(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">Đang xử lý, vui lòng không đóng trang…</p>
            </Card>
          ) : uploadState === 'success' ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={30} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">Upload thành công!</h3>
              <p className="text-sm text-gray-500">Đang chuyển hướng về danh sách video…</p>
            </Card>
          ) : (
            <Card className="p-8 text-center border-red-200 dark:border-red-800">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={30} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">Upload thất bại</h3>
              <p className="text-sm text-gray-500 mb-4">Có lỗi xảy ra trong quá trình upload. Vui lòng thử lại.</p>
              <Button variant="secondary" onClick={reset}>Thử lại</Button>
            </Card>
          )}

          {/* Form */}
          {(uploadState === 'idle' || uploadState === 'selected') && (
            <Card className="p-5 space-y-4">
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Thông tin video</h2>
              <Input label="Tên video *" placeholder="VD: Hướng dẫn chụp ảnh chân dung ngoài trời"
                value={title} onChange={e => setTitle(e.target.value)} error={errors.title}
                disabled={!!reuploadVideo} />
              <Textarea label="Ghi chú cho Reviewer" placeholder="Mô tả ngắn nội dung, điểm cần chú ý…"
                value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[80px]" />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Danh mục</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {reuploadVideo && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs text-orange-700 dark:text-orange-400">
                  <strong>Re-upload:</strong> Phiên bản v{reuploadVideo.currentVersion + 1} sẽ được tạo tự động.
                  File cũ (v{reuploadVideo.currentVersion}) sẽ được giữ lại trong 3 ngày.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button variant="primary" icon={<Upload size={14} />} onClick={doUpload}
                  disabled={!file}>
                  {reuploadVideo ? `Re-upload v${reuploadVideo.currentVersion + 1}` : 'Upload video'}
                </Button>
                <Button variant="ghost" onClick={() => navigate(-1)}>Huỷ</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
