import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function UserDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAppointments().then(d => setAppointments(d.appointments || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const pending = appointments.filter(a => a.status === 'pending').length;
  const approved = appointments.filter(a => a.status === 'approved').length;

  const statusStyles = {
    pending: { bg: 'var(--accent-amber-dim)', color: 'var(--accent-amber)' },
    approved: { bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' },
    rejected: { bg: 'var(--accent-rose-dim)', color: 'var(--accent-rose)' },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome, {user?.name}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your equipment bookings and session logs</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-5 animate-fade-in delay-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Pending Bookings</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-amber)' }}>{pending}</p>
        </div>
        <div className="rounded-xl p-5 animate-fade-in delay-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Approved Sessions</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-emerald)' }}>{approved}</p>
        </div>
        <div className="rounded-xl p-5 animate-fade-in delay-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Bookings</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent-cyan)' }}>{appointments.length}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/book" className="rounded-xl p-6 block no-underline animate-fade-in delay-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', transition: 'all var(--transition-base)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Book Equipment</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reserve a time slot on a machine</p>
        </Link>
        <Link to="/log" className="rounded-xl p-6 block no-underline animate-fade-in delay-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', transition: 'all var(--transition-base)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-emerald)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          <div className="text-2xl mb-2">📝</div>
          <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Log a Session</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Record equipment status and observations</p>
        </Link>
      </div>

      {/* Recent bookings */}
      <div className="rounded-xl overflow-hidden animate-fade-in delay-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Your Recent Bookings</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
          </div>
        ) : appointments.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No bookings yet. <Link to="/book" style={{ color: 'var(--accent-cyan)' }}>Book equipment now</Link></p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {appointments.slice(0, 8).map(a => (
              <div key={a.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.equipment_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(a.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-medium" style={statusStyles[a.status]}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
