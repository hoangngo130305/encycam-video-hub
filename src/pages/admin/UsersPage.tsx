import { useState, useEffect } from 'react';
import { UserPlus, Lock, Unlock, Pencil, Search, Shield, Users, Trash2, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import TopBar from '../../components/layout/TopBar';
import { Avatar, Button, Card, RoleBadge, Modal, Input } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { Role } from '../../types';

const ALL_ROLES: { value: Role; label: string; desc: string; trackOn: string }[] = [
  { value: 'btv',      label: 'BTV',        desc: 'Upload & re-upload video',        trackOn: 'bg-blue-500'   },
  { value: 'reviewer', label: 'Reviewer',   desc: 'Review, comment, yêu cầu sửa',   trackOn: 'bg-green-500'  },
  { value: 'final',    label: 'Duyệt cuối', desc: 'Approve / Reject, tải về máy',   trackOn: 'bg-orange-500' },
  { value: 'admin',    label: 'Admin',      desc: 'Toàn quyền hệ thống',            trackOn: 'bg-violet-600' },
];

const ROLE_PRIORITY: Role[] = ['admin', 'final', 'reviewer', 'btv'];

function getPrimaryRole(selected: Role[]): Role {
  return ROLE_PRIORITY.find(r => selected.includes(r)) ?? 'btv';
}

function RoleToggles({ selected, onChange }: { selected: Role[]; onChange: (roles: Role[]) => void }) {
  const toggle = (role: Role) => {
    if (selected.includes(role)) {
      if (selected.length === 1) return;
      onChange(selected.filter(r => r !== role));
    } else {
      onChange([...selected, role]);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Phân quyền (có thể bật nhiều)</p>
      <div className="flex flex-col gap-2">
        {ALL_ROLES.map(r => {
          const active = selected.includes(r.value);
          const isPrimary = getPrimaryRole(selected) === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => toggle(r.value)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left w-full"
            >
              {/* Toggle switch */}
              <div className={cn(
                'relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200',
                active ? r.trackOn : 'bg-gray-200 dark:bg-gray-700'
              )}>
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                  active ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-semibold', active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400')}>
                    {r.label}
                  </span>
                  {active && isPrimary && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      PRIMARY
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{r.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
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

  const [addName,        setAddName]        = useState('');
  const [addEmail,       setAddEmail]       = useState('');
  const [addRoles,       setAddRoles]       = useState<Role[]>(['btv']);
  const [addPassword,    setAddPassword]    = useState('');
  const [addErrors,      setAddErrors]      = useState<Record<string, string>>({});

  const [editName,       setEditName]       = useState('');
  const [editEmail,      setEditEmail]      = useState('');
  const [editRoles,      setEditRoles]      = useState<Role[]>(['btv']);
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

    const primary = getPrimaryRole(addRoles);
    const extra   = addRoles.filter(r => r !== primary);
    setActionLoading(true);
    try {
      const user = await userService.create({ name: addName.trim(), email: addEmail.trim(), role: primary, extraRoles: extra, password: addPassword });
      setUsers([...users, user]);
      showToast(`Đã thêm user ${user.name}`, 'success');
      setAddModal(false);
      setAddName(''); setAddEmail(''); setAddRoles(['btv']); setAddPassword(''); setAddErrors({});
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Không thể thêm user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (id: number) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    const allR: Role[] = (u.allRoles?.length ? u.allRoles : [u.role]) as Role[];
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoles(allR);
    setEditTelegramId(u.telegramChatId ?? '');
    setEditModal(id);
  };

  const doEditUser = async () => {
    if (!editModal) return;
    const primary = getPrimaryRole(editRoles);
    const extra   = editRoles.filter(r => r !== primary);
    setActionLoading(true);
    try {
      const updated = await userService.update(editModal, { name: editName.trim(), email: editEmail.trim(), role: primary, extraRoles: extra, telegramChatId: editTelegramId.trim() });
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

          {/* Giải thích phân quyền */}
          <Card className="overflow-hidden">
            <button
              onClick={() => setShowMatrix(v => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left">
              <Shield size={14} className="text-violet-500" />
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Vai trò & quyền hạn</span>
              <span className="text-xs text-gray-400 ml-1">— 1 user có thể có nhiều vai trò</span>
              {showMatrix ? <ChevronUp size={14} className="ml-auto text-gray-400" /> : <ChevronDown size={14} className="ml-auto text-gray-400" />}
            </button>
            {showMatrix && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { role: 'BTV', color: 'text-blue-600', items: ['Upload / Re-upload video', 'Xem video của mình'] },
                  { role: 'Reviewer', color: 'text-green-600', items: ['Xem tất cả video', 'Review, comment, yêu cầu sửa', 'Chuyển lên Duyệt cuối'] },
                  { role: 'Duyệt cuối', color: 'text-orange-600', items: ['Approve / Reject', 'Tải video về máy', 'Tự đăng YouTube khi approve'] },
                  { role: 'Admin', color: 'text-violet-600', items: ['Toàn quyền (bao gồm tất cả)', 'Quản lý user & phân quyền', 'Xem audit log'] },
                ].map(({ role, color, items }) => (
                  <div key={role} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
                    <p className={cn('font-bold mb-1.5', color)}>{role}</p>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      {items.map(i => <li key={i}>· {i}</li>)}
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
            ) : filtered.map((u, i) => {
              const uRoles = (u.allRoles?.length ? u.allRoles : [u.role]) as Role[];
              const isAdmin = uRoles.includes('admin');
              return (
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
                  {/* Hiện tất cả roles */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {uRoles.map(r => <RoleBadge key={r} role={r} />)}
                  </div>
                  <span title={u.telegramChatId ? 'Đã liên kết Telegram' : 'Chưa có Telegram ID'}>
                    <Send size={13} className={u.telegramChatId ? 'text-blue-400 flex-shrink-0' : 'text-gray-200 dark:text-gray-700 flex-shrink-0'} />
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <Button variant="ghost" size="xs" icon={<Pencil size={11} />} onClick={() => openEdit(u.id)}>Sửa</Button>
                    {u.id !== currentUser?.id && !isAdmin && (
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
              );
            })}
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
          <Input label="Họ tên *"     placeholder="Nguyễn Văn A"        value={addName}     onChange={e => setAddName(e.target.value)}     error={addErrors.name} />
          <Input label="Email *"      type="email" placeholder="email@encycam.vn" value={addEmail} onChange={e => setAddEmail(e.target.value)} error={addErrors.email} />
          <Input label="Mật khẩu *"  type="password" placeholder="Tối thiểu 8 ký tự" value={addPassword} onChange={e => setAddPassword(e.target.value)} error={addErrors.password} />
          <RoleToggles selected={addRoles} onChange={setAddRoles} />
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
          <RoleToggles selected={editRoles} onChange={setEditRoles} />
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
