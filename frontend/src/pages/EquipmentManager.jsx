import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function EquipmentManager() {
  const [equipment, setEquipment] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Edit state
  const [editEq, setEditEq] = useState(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

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
      await api.updateEquipment(id, { is_active: !currentActive });
      setEquipment(prev => prev.map(e => e.id === id ? { ...e, is_active: currentActive ? 0 : 1 } : e));
      setMessage({ type: 'success', text: `Equipment ${currentActive ? 'deactivated' : 'activated'}` });
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  function openEdit(eq) {
    setEditEq(eq);
    setEditForm({ name: eq.name });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.name === editEq.name) {
      setEditEq(null);
      return;
    }
    setSaving(true); setMessage(null);
    try {
      await api.updateEquipment(editEq.id, { name: editForm.name.trim() });
      setMessage({ type: 'success', text: 'Equipment renamed successfully' });
      setEditEq(null);
      loadEquipment();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t); } }, [message]);

  const inputStyle = { background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Equipment Manager</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add, rename, activate, or deactivate cleanroom equipment</p>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(eq)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                        style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: 'none' }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleToggle(eq.id, eq.is_active)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                        style={{ background: eq.is_active ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)', color: eq.is_active ? 'var(--accent-rose)' : 'var(--accent-emerald)', border: `1px solid ${eq.is_active ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                        {eq.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditEq(null)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Rename Equipment</h3>
              <button onClick={() => setEditEq(null)} className="text-xl cursor-pointer p-1" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Equipment Name</label>
                <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ name: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setEditEq(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white', border: 'none', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
