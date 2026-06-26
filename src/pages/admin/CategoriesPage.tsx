import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Youtube, ExternalLink, ShoppingBag } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { categoryService } from '../../services/categoryService';
import TopBar from '../../components/layout/TopBar';
import { Button, Card, Modal, Input } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { Category } from '../../types';

const YT_CATEGORIES = [
  { id: '22', label: 'People & Blogs' },
  { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News & Politics' },
  { id: '26', label: 'Howto & Style' },
  { id: '27', label: 'Education' },
  { id: '28', label: 'Science & Technology' },
  { id: '19', label: 'Travel & Events' },
  { id: '17', label: 'Sports' },
  { id: '1',  label: 'Film & Animation' },
  { id: '23', label: 'Comedy' },
];

function ytCategoryLabel(id: string) {
  return YT_CATEGORIES.find(c => c.id === id)?.label ?? id;
}

function extractPlaylistId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const list = url.searchParams.get('list');
    if (list) return list;
  } catch {
    // not a URL — treat as raw ID
  }
  return trimmed;
}

const EMPTY = { name: '', youtubePlaylistId: '', youtubeCategoryId: '22', forSale: false };

export default function CategoriesPage() {
  const { showToast } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [addModal,    setAddModal]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    categoryService.list()
      .then(setCategories)
      .catch(() => showToast('Không thể tải danh mục', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const openAdd = () => { setForm(EMPTY); setErrors({}); setAddModal(true); };
  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      youtubePlaylistId: cat.youtubePlaylistId,
      youtubeCategoryId: cat.youtubeCategoryId,
      forSale: cat.forSale,
    });
    setErrors({});
    setEditTarget(cat);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vui lòng nhập tên danh mục';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const doCreate = async () => {
    if (!validate()) return;
    setActionLoading(true);
    try {
      const cat = await categoryService.create({
        name: form.name.trim(),
        youtubePlaylistId: extractPlaylistId(form.youtubePlaylistId),
        youtubeCategoryId: form.youtubeCategoryId,
        forSale: form.forSale,
      });
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      showToast(`Đã tạo danh mục "${cat.name}"`, 'success');
      setAddModal(false);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Tạo thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const doUpdate = async () => {
    if (!editTarget || !validate()) return;
    setActionLoading(true);
    try {
      const updated = await categoryService.update(editTarget.id, {
        name: form.name.trim(),
        youtubePlaylistId: extractPlaylistId(form.youtubePlaylistId),
        youtubeCategoryId: form.youtubeCategoryId,
        forSale: form.forSale,
      });
      setCategories(prev =>
        prev.map(c => c.id === updated.id ? updated : c)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
      showToast(`Đã cập nhật danh mục "${updated.name}"`, 'success');
      setEditTarget(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Cập nhật thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await categoryService.delete(deleteTarget.id);
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      showToast(`Đã xoá danh mục "${deleteTarget.name}"`, 'success');
      setDeleteTarget(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Xoá thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const FormBody = (
    <div className="space-y-4">
      <Input
        label="Tên danh mục *"
        placeholder="VD: ENCY CAM"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        error={errors.name}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          YouTube Playlist
        </label>
        <input
          type="text"
          placeholder="URL hoặc Playlist ID (PLxxx...)"
          value={form.youtubePlaylistId}
          onChange={e => setForm(f => ({ ...f, youtubePlaylistId: e.target.value }))}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />
        <p className="text-[11px] text-gray-400">
          Dán URL playlist hoặc nhập thẳng ID (PLHeQY2h8X0O...)
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Danh mục YouTube
        </label>
        <select
          value={form.youtubeCategoryId}
          onChange={e => setForm(f => ({ ...f, youtubeCategoryId: e.target.value }))}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
        >
          {YT_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <input
          type="checkbox"
          checked={form.forSale}
          onChange={e => setForm(f => ({ ...f, forSale: e.target.checked }))}
          className="w-4 h-4 rounded accent-yellow-500"
        />
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <ShoppingBag size={13} className="text-yellow-500" />
            Dùng cho Sale flow
          </div>
          <div className="text-[11px] text-gray-400">Sale Manager chỉ được chọn danh mục có bật tuỳ chọn này</div>
        </div>
      </label>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Quản lý danh mục"
        subtitle={loading ? 'Đang tải...' : `${categories.length} danh mục`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openAdd}>
            Thêm danh mục
          </Button>
        }
      />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <Tag size={14} className="text-gray-400" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Danh sách danh mục</span>
              <span className="ml-auto text-xs text-gray-400">{categories.length} danh mục</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Chưa có danh mục nào. Thêm danh mục đầu tiên.
              </div>
            ) : (
              categories.map((cat, i) => (
                <div key={cat.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors',
                    i < categories.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                  )}>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
                    <Tag size={14} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{cat.name}</span>
                      {cat.forSale && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400">
                          <ShoppingBag size={9} />
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-gray-400">
                        YT: {ytCategoryLabel(cat.youtubeCategoryId)}
                      </span>
                      {cat.youtubePlaylistId ? (
                        <a
                          href={`https://www.youtube.com/playlist?list=${cat.youtubePlaylistId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-600 font-medium"
                        >
                          <Youtube size={10} />
                          Playlist
                          <ExternalLink size={9} className="ml-0.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-300 dark:text-gray-600">Chưa có playlist</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="xs" icon={<Pencil size={11} />} onClick={() => openEdit(cat)}>
                      Sửa
                    </Button>
                    <Button
                      variant="ghost" size="xs" icon={<Trash2 size={11} />}
                      onClick={() => setDeleteTarget(cat)}
                      className="text-red-500 hover:text-red-600"
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Add modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Thêm danh mục mới"
        size="md"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<Plus size={13} />} loading={actionLoading} onClick={doCreate}>
            Thêm danh mục
          </Button>
        </>}
      >
        {FormBody}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Sửa danh mục "${editTarget?.name}"`}
        size="md"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setEditTarget(null)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<Pencil size={13} />} loading={actionLoading} onClick={doUpdate}>
            Lưu thay đổi
          </Button>
        </>}
      >
        {FormBody}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xoá danh mục"
        size="sm"
        titleColor="text-red-600 dark:text-red-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Huỷ</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} loading={actionLoading} onClick={doDelete}>
            Xoá danh mục
          </Button>
        </>}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Bạn có chắc muốn xoá danh mục <strong>{deleteTarget?.name}</strong>?<br />
          <span className="text-xs text-gray-400 mt-1 block">
            Video đã gán danh mục này sẽ không bị xoá, nhưng sẽ không được tự động upload YouTube theo danh mục nữa.
          </span>
        </p>
      </Modal>
    </div>
  );
}
