import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { VideoStatus, Role, ToastType } from '../../types';
import { STATUS_CONFIG, ROLE_CONFIG } from '../../lib/utils';

// ─── Avatar ─────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  initials: string;
  bg: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}
export function Avatar({ initials, bg, color, size = 'sm' }: AvatarProps) {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' };
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0', sizes[size])}
      style={{ background: bg, color }}>
      {initials}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: VideoStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
      cfg.bg, cfg.color, cfg.border, cfg.darkBg, cfg.darkColor)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── RoleBadge ─────────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500',
      secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent dark:text-gray-400 dark:hover:bg-gray-800',
      danger: 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
      success: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
      warning: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
    };
    const sizes = {
      xs: 'px-2.5 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-sm gap-2',
    };
    return (
      <button ref={ref}
        className={cn('inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant], sizes[size], className)}
        disabled={disabled || loading} {...props}>
        {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin-slow" /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <div className="relative">
        {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</span>}
        <input ref={ref}
          className={cn('w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10',
            leftIcon ? 'pl-9' : '',
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : '',
            className)}
          {...props} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <textarea ref={ref}
        className={cn('w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none',
          className)}
        {...props} />
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ─── Select ─────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}
export function Select({ label, value, onChange, options, className }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        className={cn('w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-blue-500 cursor-pointer', className)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────
export function Card({ children, className, onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <div onClick={onClick} style={style}
      className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}>
      {children}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  titleColor?: string;
}
export function Modal({ open, onClose, title, children, footer, size = 'md', titleColor }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 animate-scale-in',
        'flex flex-col max-h-[92dvh] sm:max-h-[90dvh]',
        'rounded-t-2xl sm:rounded-2xl',
        widths[size],
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className={cn('font-bold text-sm', titleColor ?? 'text-gray-900 dark:text-gray-100')}>{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Toasts ─────────────────────────────────────────────────────────────────
const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />,
  error: <XCircle size={15} className="text-red-500 flex-shrink-0" />,
  warning: <AlertTriangle size={15} className="text-orange-500 flex-shrink-0" />,
  info: <Info size={15} className="text-blue-500 flex-shrink-0" />,
};

export function ToastContainer({ toasts, dismiss }: { toasts: { id: string; type: ToastType; message: string }[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-xl min-w-[280px] max-w-sm animate-slide-in-right">
          {TOAST_ICONS[t.type]}
          <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 font-medium">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mb-4">{icon}</div>
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, color, onClick }: {
  label: string; value: string | number; sub?: string; icon: ReactNode; color: string; onClick?: () => void;
}) {
  return (
    <Card onClick={onClick} className="p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>{icon}</div>
      </div>
      <div className="text-3xl font-bold font-mono text-gray-900 dark:text-gray-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">{sub}</div>}
    </Card>
  );
}

// ─── WorkflowTimeline ─────────────────────────────────────────────────────────
export function WorkflowTimeline({ status }: { status: VideoStatus }) {
  const steps = [
    { key: 'pending', label: 'Pending', short: 'Chờ review' },
    { key: 'reviewing', label: 'Reviewing', short: 'Đang review' },
    { key: 'reviewed', label: 'Reviewed', short: 'Đã reviewed' },
    { key: 'approved', label: 'Approved', short: 'Đã duyệt' },
  ];

  const isTerminal = status === 'rejected' || status === 'needs_revision';
  const activeIdx = isTerminal ? 2 : steps.findIndex(s => s.key === status);

  return (
    <div className="w-full">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx && !isTerminal;
          const isTerminalStep = isTerminal && i === 2;
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                  isDone ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-600 border-blue-600 text-white' :
                  isTerminalStep ? (status === 'rejected' ? 'bg-red-500 border-red-500 text-white' : 'bg-orange-500 border-orange-500 text-white') :
                  'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400')}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={cn('mt-1 text-[10px] font-semibold text-center leading-tight whitespace-nowrap',
                  (isDone || isActive) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600')}>
                  {step.short}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-1 mt-[-14px] rounded transition-all',
                  isDone ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700')} />
              )}
            </div>
          );
        })}
      </div>
      {isTerminal && (
        <div className={cn('mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5',
          status === 'rejected' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400')}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status === 'rejected' ? 'bg-red-500' : 'bg-orange-500')} />
          {status === 'rejected' ? 'Đã từ chối' : 'Cần sửa lại'}
        </div>
      )}
    </div>
  );
}
