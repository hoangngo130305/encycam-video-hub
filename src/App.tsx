import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VideoListPage from './pages/VideoListPage';
import VideoDetailPage from './pages/VideoDetailPage';
import UploadPage from './pages/UploadPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import SaleManagerDashboardPage from './pages/sale/SaleManagerDashboardPage';
import SaleManagerProjectsPage from './pages/sale/SaleManagerProjectsPage';
import SaleManagerUsersPage from './pages/sale/SaleManagerUsersPage';
import SaleVideoQueuePage from './pages/sale/SaleVideoQueuePage';
import SaleVideoDetailPage from './pages/sale/SaleVideoDetailPage';
import SaleDashboardPage from './pages/sale/SaleDashboardPage';
import SaleUploadPage from './pages/sale/SaleUploadPage';

function ProtectedRoutes() {
  const { currentUser } = useAppStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  const allRoles = currentUser.allRoles?.length ? currentUser.allRoles : [currentUser.role];
  const isAdmin        = allRoles.includes('admin');
  const isBtv          = allRoles.includes('btv');
  const isSaleManager  = allRoles.includes('sale_manager');
  const isSale         = allRoles.includes('sale');
  const isSaleFlow     = isSaleManager || isSale;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard — role-based */}
        <Route path="/dashboard" element={
          isAdmin ? <AdminOverviewPage /> :
          isSaleManager ? <SaleManagerDashboardPage /> :
          isSale ? <SaleDashboardPage /> :
          <DashboardPage />
        } />

        {/* BTV flow */}
        <Route path="/videos" element={<VideoListPage />} />
        <Route path="/videos/:id" element={
          isSaleFlow ? <SaleVideoDetailPage /> : <VideoDetailPage />
        } />
        {isBtv && <Route path="/upload" element={<UploadPage />} />}

        {/* Sale flow — video list & detail */}
        {(isSaleFlow || isAdmin) && (
          <>
            <Route path="/sale-videos" element={<SaleVideoQueuePage />} />
            <Route path="/sale-videos/:id" element={<SaleVideoDetailPage />} />
          </>
        )}

        {/* Sale Manager — project & user management */}
        {(isSaleManager || isAdmin) && (
          <>
            <Route path="/sale-manager/projects" element={<SaleManagerProjectsPage />} />
            <Route path="/sale-manager/users" element={<SaleManagerUsersPage />} />
          </>
        )}

        {/* Sale — upload */}
        {isSale && <Route path="/sale/upload" element={<SaleUploadPage />} />}

        <Route path="/notifications" element={<NotificationsPage />} />

        {isAdmin && (
          <>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const { currentUser, authLoading, initAuth, logout } = useAppStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Listen for token expiry event fired by api.ts
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </HashRouter>
  );
}
