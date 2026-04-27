import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ApprovalQueue() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => { loadAppointments(); }, []);

  async function loadAppointments() {
    try {
      const data = await api.getAppointments();
      setAppointments(data.appointments || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAction(id, status) {
    try {
      await api.updateAppointment(id, status);
      setMessage({ type: 'success', text: `Appointment ${status}` });
      loadAppointments();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t); } }, [message]);

  const pending = appointments.filter(a => a.status === 'pending');
  const resolved = appointments.filter(a => a.status !== 'pending');

  const statusStyles = {
    pending: { bg: 'var(--accent-amber-dim)', color: 'var(--accent-amber)' },
    approved: { bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' },
    rejected: { bg: 'var(--accent-rose-dim)', color: 'var(--accent-rose)' },
  };

  function formatDate(d) { return new Date(d).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Approval Queue</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Review and process booking requests</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm animate-fade-in ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
        </div>
      ) : (
        <>
          {/* Pending */}
          <div className="mb-8">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Pending Requests
              {pending.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--accent-amber-dim)', color: 'var(--accent-amber)' }}>
                  {pending.length}
                </span>
              )}
            </h2>
            {pending.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up! No pending requests.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map(appt => (
                  <div key={appt.id} className="rounded-xl p-5 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{appt.equipment_name}</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Requested by <strong>{appt.user_name}</strong> (@{appt.user_username})</p>
                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>📅 {formatDate(appt.start_time)}</span>
                          <span>→</span>
                          <span>{formatDate(appt.end_time)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(appt.id, 'approved')} className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                          style={{ background: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => handleAction(appt.id, 'rejected')} className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                          style={{ background: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)' }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved history */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>History</h2>
              <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Equipment</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>User</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Time</th>
                      <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolved.slice(0, 20).map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="px-4 sm:px-6 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{a.equipment_name}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{a.user_name}</td>
                        <td className="px-4 sm:px-6 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(a.start_time)}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className="px-2 py-1 rounded text-xs font-medium" style={statusStyles[a.status]}>{a.status}</span>
                          {a.status === 'approved' && (
                            <button onClick={() => handleAction(a.id, 'rejected')} className="ml-3 px-2 py-1 rounded text-xs font-semibold cursor-pointer"
                              style={{ background: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.3)' }}>
                              ✕ Disapprove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
