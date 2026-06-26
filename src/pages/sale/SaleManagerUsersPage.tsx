import { useEffect, useState } from 'react';
import { UserPlus, Lock, Unlock, Trash2, Check, X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import TopBar from '../../components/layout/TopBar';
import { Button, Card, Avatar, EmptyState, Modal, Input } from '../../components/ui';
import type { User } from '../../types';

function timeAgo(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return `${Math.floor(diff / 3600000) || 1} giờ trước`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

interface CreateForm { name: string; email: string; password: string }
const EMPTY: CreateForm = { name: '', email: '', password: '' };

export default function SaleManagerUsersPage() {
  const { currentUser, showToast } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    userService.list({ role: 'sale' })
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast('Vui lòng nhập tên', 'error'); return; }
    if (!form.email.trim()) { showToast('Vui lòng nhập email', 'error'); return; }
    if (!form.password.trim()) { showToast('Vui lòng nhập mật khẩu', 'error'); return; }
    setSaving(true);
    try {
      const created = await userService.create({
        name: form.name.trim(),
        email: form.email.trim(),
        role: 'sale',
        password: form.password.trim(),
      });
      setUsers(us => [created, ...us]);
      showToast('Tạo tài khoản Sale thành công', 'success');
      setShowModal(false);
      setForm(EMPTY);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi khi tạo tài khoản', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (u: User) => {
    setTogglingId(u.id);
    try {
      const updated = await userService.toggleLock(u.id);
      setUsers(us => us.map(x => x.id === u.id ? updated : x));
      showToast(updated.locked ? `Đã khoá ${u.name}` : `Đã mở khoá ${u.name}`, 'success');
    } catch {
      showToast('Không thể thay đổi trạng thái', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.delete(deleteTarget.id);
      setUsers(us => us.filter(u => u.id !== deleteTarget.id));
      showToast('Đã xoá tài khoản', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể xoá tài khoản', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Tài khoản Sale"
        subtitle={`${users.length} tài khoản`}
        actions={
          <Button variant="primary" size="sm" icon={<UserPlus size={13} />} onClick={() => setShowModal(true)}>
            Tạo tài khoản Sale
          </Button>
        }
      />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UserPlus size={24} />}
            title="Chưa có tài khoản Sale nào"
            description="Tạo tài khoản Sale để họ có thể upload video."
            action={<Button variant="primary" icon={<UserPlus size={14} />} onClick={() => setShowModal(true)}>Tạo tài khoản Sale</Button>}
          />
        ) : (
          <Card>
            {users.map((u, i, arr) => (
              <div
                key={u.id}
                className={`flex items-center gap-3 p-4 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
              >
                <Avatar name={u.name} initials={u.initials} bg={u.avatarBg} color={u.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{u.name}</span>
                    {u.locked && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                        Khoá
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate">{u.email}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">Tạo {timeAgo(u.createdAt)}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleLock(u)}
                    disabled={togglingId === u.id}
                    title={u.locked ? 'Mở khoá' : 'Khoá tài khoản'}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      u.locked
                        ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    } disabled:opacity-50`}
                  >
                    {u.locked ? <><Unlock size={11} /> Mở khoá</> : <><Lock size={11} /> Khoá</>}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setForm(EMPTY); }}
        title="Tạo tài khoản Sale"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowModal(false); setForm(EMPTY); }} disabled={saving}>Huỷ</Button>
            <Button variant="primary" icon={saving ? undefined : <Check size={14} />} onClick={handleCreate} disabled={saving}>
              {saving ? 'Đang tạo…' : 'Tạo tài khoản'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800">
            <p className="text-xs text-pink-700 dark:text-pink-400">
              Tài khoản này sẽ có quyền <strong>Sale</strong> — chỉ upload video trong project được gán.
            </p>
          </div>
          <Input label="Họ tên *" placeholder="VD: Nguyễn Văn A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Email *" type="email" placeholder="sale@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Mật khẩu *" type="password" placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xoá tài khoản"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}><X size={14} /> Huỷ</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Đang xoá…' : 'Xoá'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Xoá tài khoản <strong>{deleteTarget?.name}</strong>? Video của họ vẫn được giữ lại.
        </p>
      </Modal>
    </div>
  );
}
