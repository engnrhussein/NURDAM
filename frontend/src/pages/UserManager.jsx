import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function UserManager() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState(null);
  const [message, setMessage] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

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
      const data = await api.createUser(name.trim(), newRole);
      setNewUser(data.user);
      setName('');
      setNewRole('user');
      loadUsers();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setCreating(false); }
  }

  function openEdit(u) {
    setEditUser(u);
    setEditForm({ name: u.name, username: u.username, role: u.role, password: '' });
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSaving(true); setMessage(null);
    try {
      const updates = {};
      if (editForm.name !== editUser.name) updates.name = editForm.name;
      if (editForm.username !== editUser.username) updates.username = editForm.username;
      if (editForm.role !== editUser.role) updates.role = editForm.role;
      if (editForm.password) updates.password = editForm.password;
      if (Object.keys(updates).length === 0) { setEditUser(null); return; }
      await api.updateUser(editUser.id, updates);
      setMessage({ type: 'success', text: 'User updated successfully' });
      setEditUser(null);
      loadUsers();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  }

  async function handleBlock(u) {
    try {
      await api.updateUser(u.id, { is_blocked: !u.is_blocked });
      setMessage({ type: 'success', text: `${u.name} has been ${u.is_blocked ? 'unblocked' : 'blocked'}` });
      loadUsers();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  async function handleDelete(id) {
    try {
      await api.deleteUser(id);
      setMessage({ type: 'success', text: 'User deleted successfully' });
      setDeleteConfirm(null);
      loadUsers();
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
  }

  function togglePassword(id) {
    setShowPasswords(p => ({ ...p, [id]: !p[id] }));
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); } }, [message]);

  const isBoss = currentUser?.is_boss === 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>User Manager</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create, edit, block, and manage all user accounts</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm animate-fade-in ${message.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {message.text}
        </div>
      )}

      {/* Create user form */}
      <div className="rounded-xl p-6 mb-6 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Create New User</h2>
        <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name (e.g., Ahmet Yılmaz)" required
            className="flex-1 min-w-[200px] px-4 py-3 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
          <select value={newRole} onChange={e => setNewRole(e.target.value)}
            className="px-4 py-3 rounded-lg text-sm outline-none cursor-pointer"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
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
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Registered Users ({users.length})</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No users registered yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Username</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Password</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Created</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isTarget_boss = u.is_boss === 1;
                  const canEdit = isBoss || (!isTarget_boss);
                  const canDelete = !isTarget_boss && u.id !== currentUser?.id;
                  const canBlock = !isTarget_boss;

                  return (
                    <tr key={u.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      opacity: u.is_blocked ? 0.5 : 1,
                      background: u.is_blocked ? 'rgba(244,63,94,0.05)' : 'transparent',
                    }}>
                      <td className="px-4 py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        <div className="flex items-center gap-2">
                          {u.name}
                          {isTarget_boss && <span title="Boss Admin" className="text-xs">👑</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{u.username}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {showPasswords[u.id] ? (u.password_plain || <span style={{color: 'var(--accent-amber)'}}>[Not Saved]</span>) : '••••••••'}
                          </span>
                          <button onClick={() => togglePassword(u.id)} className="text-xs cursor-pointer px-1" style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)' }}>
                            {showPasswords[u.id] ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          background: u.role === 'admin' ? 'var(--accent-amber-dim)' : 'var(--accent-cyan-dim)',
                          color: u.role === 'admin' ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                        }}>
                          {u.role}{isTarget_boss ? ' (boss)' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          background: u.is_blocked ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)',
                          color: u.is_blocked ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                        }}>
                          {u.is_blocked ? '🚫 Blocked' : '✅ Active'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {canEdit && (
                            <button onClick={() => openEdit(u)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                              style={{ background: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: 'none' }}>
                              ✏️ Edit
                            </button>
                          )}
                          {canBlock && (
                            <button onClick={() => handleBlock(u)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                              style={{ background: u.is_blocked ? 'var(--accent-emerald-dim)' : 'var(--accent-amber-dim)', color: u.is_blocked ? 'var(--accent-emerald)' : 'var(--accent-amber)', border: 'none' }}>
                              {u.is_blocked ? '🔓 Unblock' : '🔒 Block'}
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteConfirm(u)} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                              style={{ background: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: 'none' }}>
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditUser(null)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-xl cursor-pointer p-1" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
                <input type="text" value={editForm.username || ''} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role</label>
                <select value={editForm.role || 'user'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  disabled={editUser.is_boss === 1}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {editUser.is_boss === 1 && <p className="text-xs mt-1" style={{ color: 'var(--accent-amber)' }}>👑 Boss admin role cannot be changed</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(leave blank to keep current)</span></label>
                <input type="text" value={editForm.password || ''} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter new password..."
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteConfirm(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Delete User?</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong> and all their appointments and logs.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: 'white', border: 'none' }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
