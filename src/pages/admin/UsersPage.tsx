import { useState } from 'react';
import { UserPlus, Lock, Unlock, Pencil, Search, Shield, Users } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import TopBar from '../../components/layout/TopBar';
import { Avatar, Button, Card, RoleBadge, Modal, Input, Select } from '../../components/ui';
import type { Role } from '../../types';

const ROLE_OPTIONS = [
  { value: 'btv', label: 'BTV' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'final', label: 'Duyệt cuối' },
  { value: 'admin', label: 'Admin' },
];

export default function UsersPage() {
  const { users, addUser, updateUser, toggleLock, addAudit, currentUser, showToast } = useAppStore();
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<number | null>(null);

  // Add user form
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<Role>('btv');
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  // Edit user form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<Role>('btv');

  const editingUser = editModal ? users.find(u => u.id === editModal) : null;

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const doAddUser = () => {
    const errs: Record<string, string> = {};
    if (!addName.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!addEmail.trim()) errs.email = 'Vui lòng nhập email';
    else if (!addEmail.includes('@')) errs.email = 'Email không hợp lệ';
    if (users.some(u => u.email === addEmail)) errs.email = 'Email đã tồn tại';
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const initials = addName.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const colors: Record<Role, { bg: string; color: string }> = {
      admin: { bg: '#f3e8ff', color: '#7c3aed' },
      btv: { bg: '#dbeafe', color: '#1d4ed8' },
      reviewer: { bg: '#dcfce7', color: '#16a34a' },
      final: { bg: '#ffedd5', color: '#ea580c' },
    };
    addUser({
      id: Date.now(),
      name: addName.trim(),
      email: addEmail.trim(),
      role: addRole,
      initials,
      avatarBg: colors[addRole].bg,
      avatarColor: colors[addRole].color,
      locked: false,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    });
    if (currentUser) addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Thêm user mới: ${addName.trim()} (${addRole})`, resourceType: 'user' });
    showToast(`Đã thêm user ${addName.trim()}`, 'success');
    setAddModal(false);
    setAddName(''); setAddEmail(''); setAddRole('btv'); setAddErrors({});
  };

  const openEdit = (id: number) => {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setEditName(u.name); setEditEmail(u.email); setEditRole(u.role);
    setEditModal(id);
  };

  const doEditUser = () => {
    if (!editModal || !editingUser || !currentUser) return;
    updateUser(editModal, { name: editName.trim(), email: editEmail.trim(), role: editRole });
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `Cập nhật tài khoản ${editName.trim()} — role: ${editRole}`, resourceType: 'user', resourceId: editModal });
    showToast(`Đã cập nhật tài khoản ${editName.trim()}`, 'success');
    setEditModal(null);
  };

  const doToggleLock = (id: number) => {
    const u = users.find(x => x.id === id);
    if (!u || !currentUser) return;
    toggleLock(id);
    addAudit({ timestamp: new Date().toLocaleString('vi-VN'), user: currentUser, action: `${u.locked ? 'Mở khoá' : 'Khoá'} tài khoản ${u.name}`, resourceType: 'user', resourceId: id });
    showToast(`${u.locked ? 'Đã mở khoá' : 'Đã khoá'} tài khoản ${u.name}`, u.locked ? 'success' : 'warning');
  };

  const active = users.filter(u => !u.locked).length;
  const locked = users.filter(u => u.locked).length;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Quản lý user" subtitle={`${active} active · ${locked} bị khoá`}
        actions={<Button variant="primary" size="sm" icon={<UserPlus size={13} />} onClick={() => setAddModal(true)}>Thêm user mới</Button>} />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
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
            {filtered.map((u, i) => (
              <div key={u.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''} ${u.locked ? 'opacity-60' : ''}`}>
                <Avatar name={u.name} initials={u.initials} bg={u.avatarBg} color={u.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${u.locked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{u.name}</span>
                    {u.locked && <span className="text-xs text-red-500 font-medium">(bị khoá)</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">{u.email}</div>
                </div>
                <RoleBadge role={u.role} />
                <div className="flex items-center gap-1.5 ml-2">
                  <Button variant="ghost" size="xs" icon={<Pencil size={11} />} onClick={() => openEdit(u.id)}>Sửa</Button>
                  {u.role !== 'admin' && (
                    u.locked
                      ? <Button variant="success" size="xs" icon={<Unlock size={11} />} onClick={() => doToggleLock(u.id)}>Mở khoá</Button>
                      : <Button variant="danger" size="xs" icon={<Lock size={11} />} onClick={() => doToggleLock(u.id)}>Khoá</Button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Add user modal */}
      <Modal open={addModal} onClose={() => { setAddModal(false); setAddErrors({}); }}
        title="Thêm user mới"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<UserPlus size={13} />} onClick={doAddUser}>Thêm user</Button>
        </>}>
        <div className="space-y-3">
          <Input label="Họ tên *" placeholder="Nguyễn Văn A" value={addName} onChange={e => setAddName(e.target.value)} error={addErrors.name} />
          <Input label="Email *" type="email" placeholder="email@encycam.vn" value={addEmail} onChange={e => setAddEmail(e.target.value)} error={addErrors.email} />
          <Select label="Role" value={addRole} onChange={v => setAddRole(v as Role)} options={ROLE_OPTIONS} />
        </div>
      </Modal>

      {/* Edit user modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)}
        title="Sửa thông tin user"
        footer={<>
          <Button variant="secondary" size="sm" onClick={() => setEditModal(null)}>Huỷ</Button>
          <Button variant="primary" size="sm" icon={<Shield size={13} />} onClick={doEditUser}>Lưu thay đổi</Button>
        </>}>
        <div className="space-y-3">
          <Input label="Họ tên" value={editName} onChange={e => setEditName(e.target.value)} />
          <Input label="Email" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
          <Select label="Role" value={editRole} onChange={v => setEditRole(v as Role)} options={ROLE_OPTIONS} />
        </div>
      </Modal>
    </div>
  );
}
