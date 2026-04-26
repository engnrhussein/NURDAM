import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try { const data = await api.getUsers(); setUsers(data.users || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true); setMessage(null); setNewUser(null);
    try {
      const data = await api.createUser(name.trim());
      setNewUser(data.user);
      setName('');
      loadUsers();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setCreating(false); }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t); } }, [message]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>User Manager</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create and manage researcher accounts</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm animate-fade-in ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {message.text}
        </div>
      )}

      {/* Create user form */}
      <div className="rounded-xl p-6 mb-6 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Create New User</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name (e.g., Ahmet Yılmaz)" required
            className="flex-1 px-4 py-3 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          <button type="submit" disabled={creating} className="px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', opacity: creating ? 0.6 : 1 }}>
            {creating ? 'Creating...' : '+ Create User'}
          </button>
        </form>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Username and password will be auto-generated</p>
      </div>

      {/* Generated credentials */}
      {newUser && (
        <div className="rounded-xl p-6 mb-6 animate-scale-in" style={{ background: 'var(--accent-cyan-dim)', border: '1px solid rgba(6,182,212,0.3)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#67e8f9' }}>✨ New User Created — Share These Credentials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Username:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{newUser.username}</span>
              <button onClick={() => copyToClipboard(newUser.username)} className="ml-auto text-xs cursor-pointer px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: 'none' }}>Copy</button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Password:</span>
              <span className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{newUser.password}</span>
              <button onClick={() => copyToClipboard(newUser.password)} className="ml-auto text-xs cursor-pointer px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: 'none' }}>Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="rounded-xl overflow-hidden animate-fade-in delay-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Registered Users</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No users registered yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Username</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                  <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{u.username}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: u.role === 'admin' ? 'var(--accent-amber-dim)' : 'var(--accent-cyan-dim)', color: u.role === 'admin' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
