import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/equipment', label: 'Equipment', icon: '⚙️' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/approvals', label: 'Approvals', icon: '✅' },
  { to: '/book', label: 'Book Equipment', icon: '📋' },
  { to: '/log', label: 'Log Session', icon: '📝' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
];

const userLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/book', label: 'Book Equipment', icon: '📋' },
  { to: '/log', label: 'Log Session', icon: '📝' },
  { to: '/calendar', label: 'Calendar', icon: '📅' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  let links = isAdmin ? adminLinks : userLinks;
  if (isAdmin && !user?.is_boss) {
    links = links.filter(link => link.to !== '/admin/approvals');
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40" 
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
        style={{
          width: '260px',
          background: 'var(--bg-sidebar)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Brand */}
        <div
          className="px-6 py-6"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
            <div>
              <h1
                className="text-base font-bold tracking-wide"
                style={{ color: 'var(--text-primary)' }}
              >
                NÜRDAM
              </h1>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}
              >
                Cleanroom Manager
              </p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button 
            className="md:hidden absolute top-6 right-4 text-gray-400 p-2 cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onClose}
                  end={link.to === '/admin' || link.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive ? 'nav-active' : 'nav-inactive'
                    }`
                  }
                  style={({ isActive }) => ({
                    background: isActive
                      ? 'var(--accent-cyan-dim)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--accent-cyan-hover)'
                      : 'var(--text-secondary)',
                    borderLeft: isActive
                      ? '3px solid var(--accent-cyan)'
                      : '3px solid transparent',
                  })}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info + Logout */}
        <div
          className="px-4 py-4"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: 'white',
              }}
            >
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isAdmin ? 'Administrator' : 'Researcher'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200"
            style={{
              background: 'var(--accent-rose-dim)',
              color: '#fda4af',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(244, 63, 94, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--accent-rose-dim)';
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
