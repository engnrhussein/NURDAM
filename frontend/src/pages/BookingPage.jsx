import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function getDefaultTime(hours, minutes) {
  const d = new Date();
  if (d.getHours() >= 17) d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function BookingPage() {
  const [equipment, setEquipment] = useState([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [startTime, setStartTime] = useState(() => getDefaultTime(8, 30));
  const [endTime, setEndTime] = useState(() => getDefaultTime(17, 0));
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
    if (!equipmentId || !startTime || !endTime) return;
    if (new Date(endTime) <= new Date(startTime)) {
      setMessage({ type: 'error', text: 'End time must be after start time' });
      return;
    }
    setSubmitting(true); setMessage(null);
    try {
      await api.createAppointment(Number(equipmentId), startTime, endTime);
      setMessage({ type: 'success', text: 'Booking submitted for approval!' });
      setStartTime(''); setEndTime('');
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); } }, [message]);

  const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Book Equipment</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Reserve a time slot on a cleanroom machine</p>
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
        ) : equipment.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No active equipment available</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Equipment</label>
              <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none cursor-pointer" style={inputStyle}>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Start Time</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>End Time</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg text-sm font-semibold cursor-pointer mt-2"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white', border: 'none', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg p-4" style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <p className="text-xs" style={{ color: '#67e8f9' }}>💡 Your booking will be sent to the administrator for approval. You'll see it on the calendar once approved.</p>
      </div>
    </div>
  );
}
