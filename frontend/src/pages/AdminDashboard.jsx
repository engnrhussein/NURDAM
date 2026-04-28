import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import LiveLogs from '../components/LiveLogs';

function StatCard({ icon, label, value, color, delay }) {
  return (
    <div
      className={`rounded-xl p-5 animate-fade-in delay-${delay}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        transition: 'all var(--transition-base)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 20px ${color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${color}22`, color: color }}
        >
          {icon}
        </div>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await api.getStats();
      setStats(data.stats);
      setRecentLogs(data.recent_logs || []);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'var(--border-color)',
            borderTopColor: 'var(--accent-cyan)',
          }}
        />
      </div>
    );
  }

  const statusColors = {
    good: 'var(--accent-emerald)',
    'needs maintenance': 'var(--accent-amber)',
    offline: 'var(--accent-rose)',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Overview of your cleanroom operations
        </p>
      </div>

      <LiveLogs />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="⏳"
          label="Pending Approvals"
          value={stats?.pending_appointments || 0}
          color="var(--accent-amber)"
          delay={1}
        />
        <StatCard
          icon="⚙️"
          label="Active Equipment"
          value={stats?.active_equipment || 0}
          color="var(--accent-cyan)"
          delay={2}
        />
        <StatCard
          icon="👥"
          label="Registered Users"
          value={stats?.total_users || 0}
          color="var(--accent-emerald)"
          delay={3}
        />
        <StatCard
          icon="📝"
          label="Total Logs"
          value={stats?.total_logs || 0}
          color="#8b5cf6"
          delay={4}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          ...(user?.is_boss ? [{
            to: '/admin/approvals',
            icon: '✅',
            title: 'Review Approvals',
            desc: 'Process pending booking requests',
            color: 'var(--accent-amber)',
          }] : []),
          {
            to: '/admin/users',
            icon: '👤',
            title: 'Manage Users',
            desc: 'Create and manage researcher accounts',
            color: 'var(--accent-emerald)',
          },
          {
            to: '/calendar',
            icon: '📅',
            title: 'View Calendar',
            desc: 'See all bookings and session logs',
            color: 'var(--accent-cyan)',
          },
        ].map((action, i) => (
          <Link
            key={action.to}
            to={action.to}
            className={`rounded-xl p-5 block no-underline animate-fade-in delay-${
              i + 2
            }`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <h3
              className="font-semibold text-sm mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {action.title}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {action.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent logs */}
      <div
        className="rounded-xl p-6 animate-fade-in delay-5"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Recent Session Logs
        </h2>

        {recentLogs.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
            No session logs recorded yet
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        statusColors[log.machine_status] ||
                        'var(--text-muted)',
                    }}
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {log.equipment_name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      by {log.user_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="inline-block px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: `${statusColors[log.machine_status]}22`,
                      color: statusColors[log.machine_status],
                    }}
                  >
                    {log.machine_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
