import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import EquipmentManager from './pages/EquipmentManager';
import UserManager from './pages/UserManager';
import ApprovalQueue from './pages/ApprovalQueue';
import UserDashboard from './pages/UserDashboard';
import BookingPage from './pages/BookingPage';
import LoggingPage from './pages/LoggingPage';
import CalendarPage from './pages/CalendarPage';

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin><Layout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/equipment" element={<EquipmentManager />} />
            <Route path="/admin/users" element={<UserManager />} />
            <Route path="/admin/approvals" element={<ApprovalQueue />} />
          </Route>

          {/* User routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/log" element={<LoggingPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
