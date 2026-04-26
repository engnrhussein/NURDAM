import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function EquipmentManager() {
  const [equipment, setEquipment] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => { loadEquipment(); }, []);

  async function loadEquipment() {
    try {
      const data = await api.getEquipment();
      setEquipment(data.equipment || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      await api.addEquipment(newName.trim());
      setNewName('');
      setMessage({ type: 'success', text: 'Equipment added successfully' });
      loadEquipment();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally { setAdding(false); }
  }

  async function handleToggle(id, currentActive) {
    try {
      await api.toggleEquipment(id, !currentActive);
      setEquipment(prev => prev.map(e => e.id === id ? { ...e, is_active: currentActive ? 0 : 1 } : e));
      setMessage({ type: 'success', text: `Equipment ${currentActive ? 'deactivated' : 'activated'}` });
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t); } }, [message]);

  const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Equipment Manager</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add, activate, or deactivate cleanroom equipment</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm animate-fade-in ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl p-6 mb-8 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add New Equipment</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Equipment name" required
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none" style={inputStyle} />
          <button type="submit" disabled={adding} className="px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white', border: 'none', opacity: adding ? 0.6 : 1 }}>
            {adding ? 'Adding...' : '+ Add'}
          </button>
        </form>
      </div>

      <div className="rounded-xl overflow-hidden animate-fade-in delay-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Equipment List</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
          </div>
        ) : equipment.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No equipment registered</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(eq => (
                <tr key={eq.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{eq.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: eq.is_active ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)', color: eq.is_active ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: eq.is_active ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
                      {eq.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleToggle(eq.id, eq.is_active)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                      style={{ background: eq.is_active ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)', color: eq.is_active ? 'var(--accent-rose)' : 'var(--accent-emerald)', border: `1px solid ${eq.is_active ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                      {eq.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
