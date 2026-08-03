import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Works from './pages/Works';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Membership from './pages/Membership';
import MembershipPayment from './pages/MembershipPayment';
import PaymentSuccess from './pages/PaymentSuccess';
import MembershipConfirmation from './pages/MembershipConfirmation';
import PaymentCancelled from './pages/PaymentCancelled';
import Dashboard from './pages/Dashboard';
import { PricingPage } from './pages/PricingPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import AuthGuard from './components/auth/AuthGuard';
import SuperAdminGuard from './components/auth/SuperAdminGuard';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminNews from './pages/admin/AdminNews';
import AdminEvents from './pages/admin/AdminEvents';
import AdminMembers from './pages/admin/AdminMembers';
import AdminDonations from './pages/admin/AdminDonations';
import AdminBoardMembers from './pages/admin/AdminBoardMembers';
import AdminProjects from './pages/admin/AdminProjects';
import Donate from './pages/Donate';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/works" element={<Works />} />
      <Route path="/signup" element={<Navigate to="/membership?plan=monthly" replace />} />
      <Route path="/register" element={<Navigate to={{ pathname: '/', hash: 'uye' }} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/membership" element={<Membership />} />
      <Route path="/membership/payment" element={<MembershipPayment />} />
      <Route path="/membership-confirmation" element={<MembershipConfirmation />} />
      <Route path="/donate" element={<><Navbar /><Donate /></>} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />

      {/* Super Admin dashboard */}
      <Route path="/admin" element={<SuperAdminGuard><AdminLayout /></SuperAdminGuard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="board" element={<AdminBoardMembers />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="donations" element={<AdminDonations />} />
      </Route>
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const handleDone = useCallback(() => setLoaded(true), []);

  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <BrowserRouter>
            <ToastProvider>
              {!loaded && <LoadingScreen onDone={handleDone} />}
              <div style={{ visibility: loaded ? 'visible' : 'hidden' }}>
                <AppRoutes />
              </div>
            </ToastProvider>
          </BrowserRouter>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}
