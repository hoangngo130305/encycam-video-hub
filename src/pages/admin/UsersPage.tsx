import { useState, useEffect } from 'react';
import { UserPlus, Lock, Unlock, Pencil, Search, Shield, Users, Trash2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import TopBar from '../../components/layout/TopBar';
import { Avatar, Button, Card, RoleBadge, Modal, Input, Select } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

const ROLE_OPTIONS = [
  { value: 'btv',      label: 'BTV' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'final',    label: 'Duyệt cuối' },
  { value: 'admin',    label: 'Admin' },
];

type PermItem = { action: string; allowed: boolean };

const PERMISSION_MATRIX: Record<Role, { color: string; bg: string; items: PermItem[] }> = {
  btv: {
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900',
    items: [
      { action: 'Upload video mới',              allowed: true  },
      { action: 'Re-upload khi cần sửa',         allowed: true  },
      { action: 'Xem video của mình',            allowed: true  },
      { action: 'Review & comment video',        allowed: false },
      { action: 'Approve / Reject duyệt cuối',   allowed: false },
      { action: 'Tải video về máy',              allowed: false },
      { action: 'Đăng video lên YouTube',        allowed: false },
      { action: 'Quản lý tài khoản',            allowed: false },
    ],
  },
  reviewer: {
    color: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900',
    items: [
      { action: 'Xem tất cả video',              allowed: true  },
      { action: 'Review & comment video',        allowed: true  },
      { action: 'Yêu cầu sửa lại (BTV)',         allowed: true  },
      { action: 'Chuyển lên Duyệt cuối',         allowed: true  },
      { action: 'Upload video',                  allowed: false },
      { action: 'Approve / Reject duyệt cuối',   allowed: false },
      { action: 'Tải video về máy',              allowed: false },
      { action: 'Quản lý tài khoản',            allowed: false },
    ],
  },
  final: {
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900',
    items: [
      { action: 'Xem tất cả video',              allowed: true  },
      { action: 'Approve / Reject duyệt cuối',   allowed: true  },
      { action: 'Tải video về máy',              allowed: true  },
      { action: 'Video tự đăng YouTube khi approve', allowed: true },
      { action: 'Upload / Review video',         allowed: false },
      { action: 'Quản lý tài khoản',            allowed: false },
    ],
  },
  admin: {
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900',
    items: [
      { action: 'Toàn quyền xem tất cả video',   allowed: true  },
      { action: 'Approve / Reject duyệt cuối',   allowed: true  },
      { action: 'Tải video về máy',              allowed: true  },
      { action: 'Đăng video lên YouTube',        allowed: true  },
      { action: 'Quản lý tài khoản (thêm/sửa/xoá/khoá)', allowed: true },
      { action: 'Xem audit log toàn hệ thống',   allowed: true  },
      { action: 'Phân quyền cho user khác',      allowed: true  },
    ],
  },
};

function PermissionList({ role }: { role: Role }) {
  const cfg = PERMISSION_MATRIX[role];
  return (
    <div className={cn('rounded-lg border p-3 mt-3', cfg.bg)}>
      <p className={cn('text-xs font-bold mb-2', cfg.color)}>Quyền hạn của role này:</p>
      <ul className="space-y-1">
        {cfg.items.map(item => (
          <li key={item.action} className="flex items-center gap-2 text-xs">
            {item.allowed
              ? <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
              : <XCircle     size={12} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
            <span className={item.allowed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
              {item.action}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function UsersPage() {
  const { users, setUsers, updateUserInList, removeUserFromList, currentUser, showToast } = useAppStore();
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMatrix, setShowMatrix]   = useState(false);

  const [addModal, setAddModal]       = useState(false);
  const [editModal, setEditModal]     = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);

  const [addName,     setAddName]     = useState('');
  const [addEmail,    setAddEmail]    = useState('');
  const [addRole,     setAddRole]     = useState<Role>('btv');
  const [addPassword, setAddPassword] = useState('');
  const [addErrors,   setAddErrors]   = useState<Record<string, string>>({});

  const [editName,       setEditName]       = useState('');
  const [editEmail,      setEditEmail]      = useState('');
  const [editRole,       setEditRole]       = useState<Role>('btv');
  const [editTelegramId, setEditTelegramId] = useState('');

  useEffect(() => {
    setLoading(true);
    userService.list()
      .then(setUsers)
      .catch(() => showToast('Không thể tải danh sách user', 'error'))
      .finally(() => setLoading(false));
  }, [setUsers, showToast]);

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const doAddUser = async () => {
    const errs: Record<string, string> = {};
    if (!addName.trim())  errs.name     = 'Vui lòng nhập họ tên';
    if (!addEmail.trim()) errs.email    = 'Vui lòng nhập email';
    else if (!addEmail.includes('@')) errs.email = 'Email không hợp lệ';
    if (!addPassword.trim()) errs.password = 'Vui lòng nhập mật khẩu';
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setActionLoading(true);
    try {
      const user = await userService.create({ name: addName.trim(), email: addEmail.trim(), role: addRole, password: addPassword });
      setUsers([...users, user]);
      showToast(`Đã thêm user ${user.name}`, 'success');
      setAddModal(false);
      setAddName(''); setAddEmail(''); setAddRole('btv'); setAddPassword(''); setAddErrors({});
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể thêm user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (id: number) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setEditName(u.name); setEditEmail(u.email); setEditRole(u.role);
    setEditTelegramId(u.telegramChatId ?? '');
    setEditModal(id);
  };

  const doEditUser = async () => {
    if (!editModal) return;
    setActionLoading(true);
    try {
      const updated = await userService.update(editModal, { name: editName.trim(), email: editEmail.trim(), role: editRole, telegramChatId: editTelegramId.trim() });
      updateUserInList(updated);
      showToast(`Đã cập nhật tài khoản ${updated.name}`, 'success');
      setEditModal(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể cập nhật user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const doToggleLock = async (id: number) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setActionLoading(true);
    try {
      const updated = await userService.toggleLock(id);
      updateUserInList(updated);
      showToast(`${updated.locked ? 'Đã khoá' : 'Đã mở khoá'} tài khoản ${updated.name}`, updated.locked ? 'warning' : 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const doDeleteUser = async () => {
    if (!deleteModal) return;
    const u = users.find(x => x.id === deleteModal);
    setActionLoading(true);
    try {
      await userService.delete(deleteModal);
      removeUserFromList(deleteModal);
      showToast(`Đã xoá tài khoản ${u?.name ?? ''}`, 'success');
      setDeleteModal(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể xoá user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const active       = users.filter(u => !u.locked).length;
  const locked       = users.filter(u => u.locked).length;
  const deleteTarget = deleteModal ? users.find(u => u.id === deleteModal) : null;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Quản lý user"
        subtitle={loading ? 'Đang tải...' : `${active} active · ${locked} bị khoá`}
        actions={<Button variant="primary" size="sm" icon={<UserPlus size={13} />} onClick={() => setAddModal(true)}>Thêm user mới</Button>} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Ma trận phân quyền */}
          <Card className="overflow-hidden">
            <button
              onClick={() => setShowMatrix(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
              <Shield size={14} className="text-violet-500" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Ma trận phân quyền</span>
              <span className="text-xs text-gray-400 ml-1">— Admin phân quyền cho từng role</span>
              {showMatrix ? <ChevronUp size={14} className="ml-auto text-gray-400" /> : <ChevronDown size={14} className="ml-auto text-gray-400" />}
            </button>

            {showMatrix && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(PERMISSION_MATRIX) as [Role, typeof PERMISSION_MATRIX[Role]][]).map(([role, cfg]) => (
                  <div key={role} className={cn('rounded-xl border p-3', cfg.bg)}>
                    <div className="flex items-center gap-2 mb-2">
                      <RoleBadge role={role} />
                    </div>
                    <ul className="space-y-1">
                      {cfg.items.map(item => (
                        <li key={item.action} className="flex items-center gap-2 text-xs">
                          {item.allowed
                            ? <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                            : <XCircle     size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                          <span className={item.allowed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
                            {item.action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm user theo tên hoặc email..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
          </div>

          {/* User list */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <Users size={14} className="text-gray-400" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Danh sách tài khoản</span>
              <span className="ml-auto text-xs text-gray-400">{filtered.length} user</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.map((u, i) => (
              <div key={u.id}
                className={cn('flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                  i < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : '',
                  u.locked ? 'opacity-60' : '')}>
                <Avatar name={u.name} initials={u.initials} bg={u.avatarBg} color={u.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('font-semibold text-sm', u.locked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100')}>{u.name}</span>
                    {u.locked && <span className="text-xs text-red-500 font-medium">(bị khoá)</span>}
                    {u.id === currentUser?.id && <span className="text-xs text-blue-500 font-medium">(bạn)</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">{u.email}</div>
                </div>
                <RoleBadge role={u.role} />
                {u.telegramChatId
                  ? <Send size={13} className="text-blue-400 flex-shrink-0" title="Đã liên kết Telegram" />
                  : <Send size={13} className="text-gray-200 dark:text-gray-700 flex-shrink-0" title="Chưa có Telegram ID" />
                }
                <div className="flex items-center gap-1.5 ml-2">
                  <Button variant="ghost" size="xs" icon={<Pencil size={11} />} onClick={() => openEdit(u.id)}>Sửa</Button>
                  {u.id !== currentUser?.id && u.role !== 'admin' && (
                    <>
                      {u.locked
                        ? <Button variant="success" size="xs" icon={<Unlock size={11} />} loading={actionLoading} onClick={() => doToggleLock(u.id)}>Mở khoá</Button>
                        : <Button variant="danger"  size="xs" icon={<Lock   size={11} />} loading={actionLoading} onClick={() => doToggleLock(u.id)}>Khoá</Button>
                      }
                      <Button variant="ghost" size="xs" icon={<Trash2 size={11} />} onClick={() => setDeleteModal(u.id)} className="text-red-500 hover:text-red-600" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Add user modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setAddErrors({}); }}
        title="Thêm user mới" size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<UserPlus size={13} />} loading={actionLoading} onClick={doAddUser}>Thêm user</Button>
        </>}>
        <div className="space-y-3">
          <Input label="Họ tên *" placeholder="Nguyễn Văn A"      value={addName}     onChange={e => setAddName(e.target.value)}     error={addErrors.name} />
          <Input label="Email *"  type="email" placeholder="email@encycam.vn" value={addEmail} onChange={e => setAddEmail(e.target.value)} error={addErrors.email} />
          <Input label="Mật khẩu *" type="password" placeholder="Tối thiểu 8 ký tự" value={addPassword} onChange={e => setAddPassword(e.target.value)} error={addErrors.password} />
          <Select label="Phân quyền (Role)" value={addRole} onChange={v => setAddRole(v as Role)} options={ROLE_OPTIONS} />
          <PermissionList role={addRole} />
        </div>
      </Modal>

      {/* Edit user modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)}
        title="Sửa thông tin & phân quyền" size="lg"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setEditModal(null)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<Shield size={13} />} loading={actionLoading} onClick={doEditUser}>Lưu thay đổi</Button>
        </>}>
        <div className="space-y-3">
          <Input label="Họ tên"  value={editName}  onChange={e => setEditName(e.target.value)} />
          <Input label="Email"   type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
          <Select label="Phân quyền (Role)" value={editRole} onChange={v => setEditRole(v as Role)} options={ROLE_OPTIONS} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Send size={11} className="text-blue-400" /> Telegram Chat ID
            </label>
            <input
              type="text"
              placeholder="VD: 123456789 — nhắn @userinfobot để lấy ID"
              value={editTelegramId}
              onChange={e => setEditTelegramId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
            <p className="text-[11px] text-gray-400">
              Người dùng nhắn bất kỳ tin nào tới <b>@encycam_video_hub_bot</b>, sau đó nhắn <b>@userinfobot</b> để lấy ID số của mình.
            </p>
          </div>
          <PermissionList role={editRole} />
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}
        title="Xoá tài khoản" size="sm" titleColor="text-red-600 dark:text-red-400"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setDeleteModal(null)}>Huỷ</Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={13} />} loading={actionLoading} onClick={doDeleteUser}>Xoá tài khoản</Button>
        </>}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Bạn có chắc muốn xoá tài khoản <strong>{deleteTarget?.name}</strong>?<br />
          <span className="text-xs text-gray-500 mt-1 block">Hành động này không thể khôi phục.</span>
        </p>
      </Modal>
    </div>
  );
}
