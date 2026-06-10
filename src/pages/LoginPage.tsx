import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Video, Mail, Lock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { USERS } from '../data/mockData';
import { Button, Input, RoleBadge } from '../components/ui';
import type { Role } from '../types';

const DEMO_ACCOUNTS: { email: string; label: string; role: Role; name: string }[] = [
  { email: 'hminh@encycam.vn', role: 'btv', label: 'BTV - Hoàng Minh', name: 'Hoàng Minh' },
  { email: 'nthao@encycam.vn', role: 'reviewer', label: 'Reviewer - Nguyễn Thảo', name: 'Nguyễn Thảo' },
  { email: 'plong@encycam.vn', role: 'final', label: 'Duyệt cuối - Phạm Long', name: 'Phạm Long' },
  { email: 'admin@encycam.vn', role: 'admin', label: 'Admin System', name: 'Admin' },
];

export default function LoginPage() {
  const { login, showToast } = useAppStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doLogin = async (emailOverride?: string) => {
    const loginEmail = emailOverride ?? email;
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const user = USERS.find(u => u.email === loginEmail);
    if (!user) {
      setError('Email không tồn tại trong hệ thống');
      setLoading(false);
      return;
    }
    if (user.locked) {
      setError('Tài khoản này đã bị khoá. Liên hệ Admin để được hỗ trợ.');
      setLoading(false);
      return;
    }
    login(user);
    showToast(`Chào mừng ${user.name}!`, 'success');
    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-10 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-10 w-96 h-96 bg-violet-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <Video size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-lg">EncyCam</div>
              <div className="text-xs text-blue-200">Video Hub</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Quản lý luồng<br />duyệt video<br />chuyên nghiệp
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Nền tảng nội bộ dành cho team EncyCam Vietnam —
            upload, review, duyệt và publish video YouTube một cách có hệ thống.
          </p>

          {/* Workflow indicator */}
          <div className="mt-8 flex items-center gap-2 text-xs font-medium">
            {['Upload', 'Review', 'Duyệt', 'Publish'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">{s}</div>
                {i < 3 && <ChevronRight size={12} className="text-blue-200" />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200">
          EncyCam Vietnam · Internal · 2026
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">EncyCam Video Hub</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Đăng nhập</h1>
            <p className="text-sm text-gray-500 dark:text-gray-500">Dành riêng cho team EncyCam Vietnam</p>
          </div>

          {/* Form */}
          <form onSubmit={e => { e.preventDefault(); doLogin(); }} className="space-y-4">
            <Input label="Email" type="email" placeholder="email@encycam.vn"
              value={email} onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail size={14} />} error={error} />
            <div className="relative">
              <Input label="Mật khẩu" type={showPw ? 'text' : 'password'}
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                leftIcon={<Lock size={14} />} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 bottom-[9px] text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <Button type="submit" variant="primary" className="w-full justify-center py-2.5" loading={loading}>
              Đăng nhập
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              <span className="text-xs text-gray-400 font-medium">Demo nhanh</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} onClick={() => doLogin(acc.email)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-left group">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: USERS.find(u => u.email === acc.email)?.avatarBg, color: USERS.find(u => u.email === acc.email)?.avatarColor }}>
                    {USERS.find(u => u.email === acc.email)?.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400">{acc.name}</div>
                    <RoleBadge role={acc.role} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
            Quên mật khẩu? Liên hệ Admin để reset
          </p>
        </div>
      </div>
    </div>
  );
}
