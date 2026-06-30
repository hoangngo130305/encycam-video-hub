import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CloudUpload, FileVideo, X, CheckCircle2, AlertCircle, Upload, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { saleVideoService } from '../../services/saleVideoService';
import { saleProjectService } from '../../services/saleProjectService';
import TopBar from '../../components/layout/TopBar';
import { Button, Input, Textarea, Card } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { SaleProject } from '../../types';

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export default function SaleUploadPage() {
  const { currentUser, showToast } = useAppStore();
  const navigate = useNavigate();

  const [project, setProject] = useState<SaleProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [drag, setDrag] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saleProjectService.list()
      .then(projects => {
        // Sale only has their own project(s)
        setProject(projects[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingProject(false));
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith('.mp4')) { showToast('Chỉ nhận file .mp4', 'error'); return; }
    if (f.size > 4 * 1024 * 1024 * 1024) { showToast('File quá lớn (tối đa 4 GB)', 'error'); return; }
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
    if (!project) errs.project = 'Bạn chưa được gán vào project nào';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const doUpload = async () => {
    if (!validate() || !currentUser || !file || !project) return;
    setUploadState('uploading');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => { if (p >= 90) { clearInterval(interval); return 90; } return p + Math.random() * 8 + 2; });
    }, 300);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('project_id', String(project.id));
    if (notes.trim()) formData.append('notes', notes.trim());

    try {
      await saleVideoService.create(formData);
      clearInterval(interval);
      setProgress(100);
      setUploadState('success');
      showToast('Upload thành công! Video đang chờ Sale Manager review.', 'success');
      setTimeout(() => navigate('/sale-videos'), 1500);
    } catch (err) {
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

  if (loadingProject) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Upload video" subtitle="Đang tải project..." actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Upload video" actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={28} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">Chưa được gán project</h3>
            <p className="text-sm text-gray-500">Liên hệ Sale Manager để được gán vào một project trước khi upload video.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Upload video mới"
        subtitle={`Project: ${project.name}`}
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13} />} onClick={() => navigate(-1)}>Quay lại</Button>}
      />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Project info banner */}
          <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 flex items-center gap-3">
            <FolderOpen size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">Project: </span>
              <span className="text-xs text-yellow-700 dark:text-yellow-400 font-bold">{project.name}</span>
              <span className="text-xs text-yellow-600 dark:text-yellow-500"> · {project.category.name}</span>
            </div>
          </div>

          {/* Upload zone */}
          {uploadState === 'idle' || uploadState === 'selected' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer',
                drag ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 scale-[1.01]' :
                file ? 'border-green-400 bg-green-50 dark:bg-green-950/20 cursor-default' :
                'border-gray-300 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-700 hover:bg-pink-50/50 dark:hover:bg-pink-950/10',
              )}
            >
              <input ref={fileRef} type="file" accept=".mp4" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {!file ? (
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center mx-auto mb-4">
                    <CloudUpload size={28} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">Kéo thả file video vào đây</h3>
                  <p className="text-sm text-gray-500 mb-4">Chỉ nhận .mp4 · Tối đa 4 GB</p>
                  <Button variant="primary" size="sm" icon={<Upload size={13} />}
                    onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="bg-pink-600 hover:bg-pink-700">
                    Chọn từ máy tính
                  </Button>
                  {errors.file && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.file}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center flex-shrink-0">
                    <FileVideo size={22} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{file.name}</div>
                    <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
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
                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center flex-shrink-0">
                  <FileVideo size={20} className="text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{file?.name}</div>
                  <div className="text-xs text-gray-500">Đang upload…</div>
                </div>
                <span className="font-mono text-sm font-bold text-pink-600 flex-shrink-0">{Math.floor(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">Đang xử lý, vui lòng không đóng trang…</p>
            </Card>
          ) : uploadState === 'success' ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={30} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">Upload thành công!</h3>
              <p className="text-sm text-gray-500">Sale Manager sẽ review và phản hồi cho bạn sớm.</p>
            </Card>
          ) : (
            <Card className="p-8 text-center border-red-200 dark:border-red-800">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={30} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">Upload thất bại</h3>
              <p className="text-sm text-gray-500 mb-4">Có lỗi xảy ra. Vui lòng thử lại.</p>
              <Button variant="secondary" onClick={reset}>Thử lại</Button>
            </Card>
          )}

          {/* Form */}
          {(uploadState === 'idle' || uploadState === 'selected') && (
            <Card className="p-5 space-y-4">
              <h2 className="font-bold text-sm text-gray-900 dark:text-gray-100">Thông tin video</h2>
              <Input
                label="Tên video *"
                placeholder="VD: Video giới thiệu khách hàng Nguyễn Văn A"
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={errors.title}
              />
              <Textarea
                label="Ghi chú cho Sale Manager"
                placeholder="Mô tả ngắn nội dung, điểm cần chú ý…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-3 pt-1">
                <Button
                  variant="primary"
                  icon={<Upload size={14} />}
                  onClick={doUpload}
                  disabled={!file}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  Upload video
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
