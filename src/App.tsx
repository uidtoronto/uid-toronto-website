import { useState, useCallback, lazy, useMemo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
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
import Donate from './pages/Donate';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminNews = lazy(() => import('./pages/admin/AdminNews'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'));
const AdminBoardMembers = lazy(() => import('./pages/admin/AdminBoardMembers'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));

function AppRouter() {
  const router = useMemo(() => createBrowserRouter([
    { path: '/', element: <><Navbar /><Home /></> },
    { path: '/works', element: <Works /> },
    { path: '/signup', element: <Navigate to="/membership?plan=monthly" replace /> },
    { path: '/register', element: <Navigate to={{ pathname: '/', hash: 'uye' }} replace /> },
    { path: '/login', element: <Login /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },
    { path: '/membership', element: <Membership /> },
    { path: '/membership/payment', element: <MembershipPayment /> },
    { path: '/membership-confirmation', element: <MembershipConfirmation /> },
    { path: '/donate', element: <><Navbar /><Donate /></> },
    { path: '/payment-success', element: <PaymentSuccess /> },
    { path: '/payment-cancelled', element: <PaymentCancelled /> },
    { path: '/pricing', element: <PricingPage /> },
    { path: '/unauthorized', element: <Unauthorized /> },
    { path: '/dashboard', element: <AuthGuard><Dashboard /></AuthGuard> },
    {
      path: '/admin',
      element: <SuperAdminGuard><AdminLayout /></SuperAdminGuard>,
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: 'news', element: <AdminNews /> },
        { path: 'events', element: <AdminEvents /> },
        { path: 'members', element: <AdminMembers /> },
        { path: 'board', element: <AdminBoardMembers /> },
        { path: 'projects', element: <AdminProjects /> },
        { path: 'donations', element: <AdminDonations /> },
      ],
    },
    { path: '/admin/*', element: <Navigate to="/admin" replace /> },
    { path: '*', element: <NotFound /> },
  ]), []);

  return <RouterProvider router={router} />;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const handleDone = useCallback(() => setLoaded(true), []);

  return (
    <ErrorBoundary>
      <LangProvider>
        <AuthProvider>
          <ToastProvider>
            {!loaded && <LoadingScreen onDone={handleDone} />}
            <div style={{ visibility: loaded ? 'visible' : 'hidden' }}>
              <AppRouter />
            </div>
          </ToastProvider>
        </AuthProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}
