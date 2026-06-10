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

function ProtectedRoutes() {
  const { currentUser } = useAppStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  const isAdmin = currentUser.role === 'admin';
  const isBtv = currentUser.role === 'btv';

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={isAdmin ? <AdminOverviewPage /> : <DashboardPage />} />
        <Route path="/videos" element={<VideoListPage />} />
        <Route path="/videos/:id" element={<VideoDetailPage />} />
        {isBtv && <Route path="/upload" element={<UploadPage />} />}
        <Route path="/notifications" element={<NotificationsPage />} />
        {isAdmin && (
          <>
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  const { currentUser } = useAppStore();

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </HashRouter>
  );
}
