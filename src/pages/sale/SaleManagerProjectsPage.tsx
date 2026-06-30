import { useEffect, useState } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Check, User, Shield } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { saleProjectService } from '../../services/saleProjectService';
import { categoryService } from '../../services/categoryService';
import { userService } from '../../services/userService';
import TopBar from '../../components/layout/TopBar';
import { Button, Card, Avatar, EmptyState, Modal, Input } from '../../components/ui';
import type { SaleProject, Category, User as UserType } from '../../types';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return `${Math.floor(diff / 3600000) || 1} giờ trước`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

interface ProjectFormData {
  name: string;
  categoryId: number | '';
  saleId: number | '';
}

const EMPTY_FORM: ProjectFormData = { name: '', categoryId: '', saleId: '' };

export default function SaleManagerProjectsPage() {
  const { currentUser, showToast } = useAppStore();
  const isAdmin = (currentUser?.allRoles ?? [currentUser?.role]).includes('admin');

  const [projects, setProjects] = useState<SaleProject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saleUsers, setSaleUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<SaleProject | null>(null);
  const [form, setForm] = useState<ProjectFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SaleProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      saleProjectService.list(),
      categoryService.list({ forSale: true }),
      userService.list({ role: 'sale' }),
    ]).then(([projs, cats, users]) => {
      setProjects(projs as SaleProject[]);
      setCategories(cats as Category[]);
      setSaleUsers(users as UserType[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saleCategory = categories.find(c => c.forSale) ?? categories[0] ?? null;

  const openCreate = () => {
    setEditProject(null);
    setForm({ ...EMPTY_FORM, categoryId: saleCategory?.id ?? '' });
    setShowModal(true);
  };

  const openEdit = (p: SaleProject) => {
    setEditProject(p);
    setForm({
      name: p.name,
      categoryId: saleCategory?.id ?? p.category.id,
      saleId: p.sale?.id ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProject(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Vui lòng nhập tên project', 'error'); return; }
    if (!form.categoryId && !saleCategory) { showToast('Không tìm thấy danh mục Sale', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId || saleCategory?.id),
        saleId: form.saleId ? Number(form.saleId) : undefined,
      };
      if (editProject) {
        const updated = await saleProjectService.update(editProject.id, payload);
        setProjects(ps => ps.map(p => p.id === editProject.id ? updated : p));
        showToast('Đã cập nhật project', 'success');
      } else {
        const created = await saleProjectService.create(payload);
        setProjects(ps => [created, ...ps]);
        showToast('Đã tạo project mới', 'success');
      }
      closeModal();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi lưu project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await saleProjectService.delete(deleteTarget.id);
      setProjects(ps => ps.filter(p => p.id !== deleteTarget.id));
      showToast('Đã xoá project', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xoá project', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Quản lý Projects"
        subtitle={`${projects.length} project`}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={openCreate}>
            Tạo project
          </Button>
        }
      />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={24} />}
            title="Chưa có project nào"
            description="Tạo project đầu tiên để bắt đầu gán Sale upload video."
            action={<Button variant="primary" icon={<Plus size={14} />} onClick={openCreate}>Tạo project</Button>}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <Card key={p.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center flex-shrink-0">
                      <FolderOpen size={16} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 truncate">{p.category.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Sale Manager — chỉ admin thấy để biết ai quản lý */}
                {isAdmin && p.saleManager && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900">
                    <Shield size={10} className="text-violet-400 flex-shrink-0" />
                    <span className="text-[11px] text-violet-600 dark:text-violet-400 truncate">
                      SM: {p.saleManager.name}
                    </span>
                  </div>
                )}

                {/* Sale */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  {p.sale ? (
                    <>
                      <Avatar name={p.sale.name} initials={p.sale.initials} bg={p.sale.avatarBg} color={p.sale.avatarColor} size="xs" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{p.sale.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{p.sale.email}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <User size={11} className="text-gray-400" />
                      </div>
                      <span className="text-xs text-gray-400 italic">Chưa gán Sale</span>
                    </>
                  )}
                </div>

                <div className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                  Tạo {timeAgo(p.createdAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editProject ? 'Chỉnh sửa project' : 'Tạo project mới'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Huỷ</Button>
            <Button variant="primary" icon={saving ? undefined : <Check size={14} />} onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu…' : editProject ? 'Lưu thay đổi' : 'Tạo project'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tên project *"
            placeholder="VD: Khách hàng VIP Q1 2026"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Danh mục</span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <FolderOpen size={14} className="text-yellow-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                {saleCategory?.name ?? 'KHÁCH HÀNG TIÊU BIỂU'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Gán Sale</label>
            <select
              value={form.saleId}
              onChange={e => setForm(f => ({ ...f, saleId: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/10 cursor-pointer"
            >
              <option value="">-- Chưa gán --</option>
              {saleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            {saleUsers.length === 0 && (
              <p className="text-xs text-gray-400">Chưa có tài khoản Sale nào. Tạo tài khoản Sale trước.</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xoá project"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Huỷ</Button>
            <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Đang xoá…' : 'Xoá project'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Bạn có chắc muốn xoá project <strong>{deleteTarget?.name}</strong>?
          Video trong project này sẽ không bị xoá nhưng sẽ mất liên kết project.
        </p>
      </Modal>
    </div>
  );
}
