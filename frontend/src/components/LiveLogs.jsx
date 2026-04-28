import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function LiveLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    api.getLogs().then(d => setLogs(d.logs || [])).catch(console.error).finally(() => setLoading(false));
  };

  // Poll every 10 seconds for live updates
  useEffect(() => {
    fetchLogs();
    const intervalId = setInterval(fetchLogs, 10000);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl p-8 animate-fade-in mb-8 flex justify-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
      </div>
    );
  }

  if (logs.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden mb-8 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 0 20px rgba(6, 182, 212, 0.05)' }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1), transparent)' }}>
        <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent-cyan)' }}></span>
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: 'var(--accent-cyan)' }}></span>
          </span>
          Live Session Logs
        </h2>
        <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Auto-updating</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full md:min-w-[1000px] mobile-rotated-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Equipment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>System Vac</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Process Vac</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Foreline</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Gauge</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Machine Vac</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Temp</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Observations</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {logs.slice(0, 5).map(log => {
              const isMag = log.equipment_name.toLowerCase().includes('magnetron');
              return (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm md:text-xs justify-center md:justify-start whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium justify-center md:justify-start" style={{ color: 'var(--text-primary)' }}>{log.user_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--accent-cyan)' }}>{log.equipment_name}</td>
                  <td className="px-4 py-3 justify-center md:justify-start">
                    <span className="text-lg" title={log.machine_status}>
                      {log.machine_status === 'good' ? '✅' : log.machine_status === 'offline' ? '🔴' : '🔧'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm md:text-xs font-bold md:font-normal font-mono justify-center md:justify-start" style={{ color: isMag ? 'var(--text-secondary)' : 'var(--border-color)' }}>{isMag ? log.system_vacuum : '-'}</td>
                  <td className="px-4 py-3 text-sm md:text-xs font-bold md:font-normal font-mono justify-center md:justify-start" style={{ color: isMag ? 'var(--text-secondary)' : 'var(--border-color)' }}>{isMag ? log.process_vacuum : '-'}</td>
                  <td className="px-4 py-3 text-sm md:text-xs font-bold md:font-normal font-mono justify-center md:justify-start" style={{ color: isMag ? 'var(--text-secondary)' : 'var(--border-color)' }}>{isMag ? log.foreline_vacuum : '-'}</td>
                  <td className="px-4 py-3 text-sm md:text-xs font-bold md:font-normal font-mono justify-center md:justify-start" style={{ color: isMag ? 'var(--text-secondary)' : 'var(--border-color)' }}>{isMag ? log.installed_gauge : '-'}</td>
                  <td className="px-4 py-3 text-sm md:text-xs font-bold md:font-normal font-mono justify-center md:justify-start" style={{ color: isMag ? 'var(--text-secondary)' : 'var(--border-color)' }}>{isMag ? log.connect_machine : '-'}</td>
                  <td className="px-4 py-3 text-sm md:text-xs font-bold md:font-normal font-mono justify-center md:justify-start" style={{ color: isMag ? 'var(--text-secondary)' : 'var(--border-color)' }}>{isMag ? log.temperature : '-'}</td>
                  <td className="px-4 py-3 text-xs md:max-w-[200px] truncate" title={log.observations} style={{ color: 'var(--text-muted)' }}>{log.observations || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
