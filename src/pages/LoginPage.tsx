import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Video, Mail, Lock, ChevronRight } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { authService } from "../services/authService";
import { notificationService } from "../services/notificationService";
import { Button, Input } from "../components/ui";

export default function LoginPage() {
  const { login, setNotifications, showToast } = useAppStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (emailOverride?: string, passwordOverride?: string) => {
    const loginEmail = (emailOverride ?? email).trim();
    const loginPw = passwordOverride ?? password;
    setLoading(true);
    setError("");

    try {
      const { user } = await authService.login(loginEmail, loginPw);

      if (user.locked) {
        setError("Tài khoản này đã bị khoá. Liên hệ Admin để được hỗ trợ.");
        setLoading(false);
        return;
      }

      login(user);

      // Pre-load notifications for badge count
      try {
        const notifs = await notificationService.list();
        setNotifications(user.role, notifs);
      } catch {
        /* silent */
      }

      showToast(`Chào mừng ${user.name}!`, "success");
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-10 text-white relative overflow-hidden">
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
            Quản lý luồng
            <br />
            duyệt video
            <br />
            chuyên nghiệp
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Nền tảng nội bộ dành cho team EncyCam Vietnam — upload, review,
            duyệt và publish video YouTube một cách có hệ thống.
          </p>

          <div className="mt-8 flex items-center gap-2 text-xs font-medium">
            {["Upload", "Review", "Duyệt", "Publish"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">
                  {s}
                </div>
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
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            EncyCam Video Hub
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Đăng nhập
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Dành riêng cho team EncyCam Vietnam
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin();
            }}
            className="space-y-4"
          >
            <Input
              label="Email"
              type="email"
              placeholder="email@encycam.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={14} />}
              error={error}
            />
            <div className="relative">
              <Input
                label="Mật khẩu"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={14} />}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 bottom-[9px] text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-600">
            Quên mật khẩu? Liên hệ Admin để reset
          </p>
        </div>
      </div>
    </div>
  );
}
