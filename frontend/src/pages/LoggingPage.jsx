import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS_OPTIONS = [
  { value: 'good', label: 'Good', icon: '✅', color: 'var(--accent-emerald)' },
  { value: 'needs maintenance', label: 'Needs Maintenance', icon: '🔧', color: 'var(--accent-amber)' },
  { value: 'offline', label: 'Offline', icon: '🔴', color: 'var(--accent-rose)' },
];

export default function LoggingPage() {
  const [equipment, setEquipment] = useState([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [status, setStatus] = useState('good');
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getEquipment().then(d => {
      const active = (d.equipment || []).filter(e => e.is_active);
      setEquipment(active);
      if (active.length) setEquipmentId(active[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!equipmentId || !status) return;
    setSubmitting(true); setMessage(null);
    try {
      await api.createLog(Number(equipmentId), status, observations);
      setMessage({ type: 'success', text: 'Session log recorded successfully!' });
      setObservations('');
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); } }, [message]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Log Session</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Record equipment status and observations after your session</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm animate-fade-in ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl p-8 animate-fade-in max-w-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Equipment</label>
              <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none cursor-pointer"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Machine Status</label>
              <div className="grid grid-cols-3 gap-3">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: status === opt.value ? `${opt.color}22` : 'var(--bg-secondary)',
                      border: `2px solid ${status === opt.value ? opt.color : 'var(--border-color)'}`,
                      color: status === opt.value ? opt.color : 'var(--text-secondary)',
                    }}>
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs font-medium text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Observations</label>
              <textarea value={observations} onChange={e => setObservations(e.target.value)}
                placeholder="Describe any issues, measurements, or notes from your session..."
                rows={4} className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg text-sm font-semibold cursor-pointer mt-2"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Recording...' : '📝 Record Session Log'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg p-4" style={{ background: 'var(--accent-emerald-dim)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p className="text-xs" style={{ color: '#6ee7b7' }}>⏱️ The timestamp will be automatically recorded by the server. Your log will appear on the unified calendar.</p>
      </div>
    </div>
  );
}
