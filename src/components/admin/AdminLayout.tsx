import { useState, useEffect, Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X, UserCircle, Newspaper, Calendar, Users, Heart, UserSquare2, FolderKanban, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminSuccessProvider } from '../../context/AdminSuccessContext';
import { ConfirmProvider } from '../../context/ConfirmContext';
import { adminTr } from '../../lib/adminTr';
import { saveAdminRoute } from '../../lib/adminRoute';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    saveAdminRoute(location.pathname);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast(adminTr.signedOut, 'success');
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: adminTr.dashboard, icon: LayoutDashboard, end: true },
    { to: '/admin/news', label: adminTr.news, icon: Newspaper },
    { to: '/admin/events', label: adminTr.events, icon: Calendar },
    { to: '/admin/board', label: adminTr.board, icon: UserSquare2 },
    { to: '/admin/projects', label: adminTr.projects, icon: FolderKanban },
    { to: '/admin/members', label: adminTr.members, icon: Users },
    { to: '/admin/donations', label: adminTr.donations, icon: Heart },
  ];

  const SidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal)', fontWeight: 600 }}>
            {adminTr.brandSubtitle}
          </p>
          <p style={{ margin: '4px 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: '#fff', fontWeight: 400 }}>
            <em>{adminTr.superAdmin}</em>
          </p>
        </Link>
      </div>

      <nav aria-label="Admin navigation" style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ to, label, icon: Icon, end }) => {
          const active = end ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="admin-nav-link focus-ring-inset"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 0.875rem', borderRadius: '10px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 500,
                textDecoration: 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                background: active ? 'linear-gradient(135deg, rgba(62,200,200,0.18), rgba(26,106,154,0.18))' : 'transparent',
                border: active ? '1px solid rgba(62,200,200,0.25)' : '1px solid transparent',
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '1rem 0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.5rem 0.75rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--uid-teal), var(--uid-mid))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserCircle size={18} color="#fff" aria-hidden="true" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="focus-ring-inset"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 0.875rem', borderRadius: '10px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <LogOut size={16} aria-hidden="true" />
          {adminTr.signOut}
        </button>
      </div>
    </div>
  );

  return (
    <ConfirmProvider>
      <AdminSuccessProvider>
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--off-white)' }}>
          <aside className="hidden md:flex" style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: '248px',
            background: 'linear-gradient(180deg, #0D4D7C 0%, #061E30 100%)',
            flexDirection: 'column', zIndex: 50,
            boxShadow: '4px 0 24px rgba(6,30,48,0.12)',
          }}>
            {SidebarContent}
          </aside>

          {sidebarOpen && (
            <>
              <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(6,30,48,0.5)', zIndex: 60, animation: 'modalBackdropIn 0.2s ease forwards' }} className="md:hidden" aria-hidden="true" />
              <aside className="md:hidden" style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(248px, 85vw)',
                background: 'linear-gradient(180deg, #0D4D7C 0%, #061E30 100%)',
                flexDirection: 'column', zIndex: 61,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}>
                {SidebarContent}
              </aside>
            </>
          )}

          <div className="admin-main md:ml-[248px]" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="md:hidden" style={{
              position: 'sticky', top: 0, zIndex: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.75rem 1rem', background: '#fff',
              borderBottom: '1px solid rgba(13,77,124,0.08)',
            }}>
              <button onClick={() => setSidebarOpen(o => !o)} aria-label={adminTr.toggleSidebar} aria-expanded={sidebarOpen} className="focus-ring" style={{ background: 'rgba(13,77,124,0.06)', border: 'none', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--uid-navy)' }}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600, color: 'var(--uid-navy)', letterSpacing: '2px', textTransform: 'uppercase' }}>{adminTr.superAdmin}</p>
              <div style={{ width: '38px' }} aria-hidden="true" />
            </div>

            <main className="admin-main-content" style={{ flex: 1, padding: '2rem 1.25rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
              <Suspense fallback={
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }} aria-busy="true" aria-label="Loading">
                  <Loader2 className="animate-spin" size={28} style={{ color: 'var(--uid-teal)' }} />
                </div>
              }>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
      </AdminSuccessProvider>
    </ConfirmProvider>
  );
}
