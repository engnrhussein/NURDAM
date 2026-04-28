import { useState, useEffect } from 'react';
import { api } from '../lib/api';

const STATUS_OPTIONS = [
  { value: 'good', label: 'Good', icon: '✅', color: 'var(--accent-emerald)' },
  { value: 'needs maintenance', label: 'Needs Maintenance', icon: '🔧', color: 'var(--accent-amber)' },
  { value: 'offline', label: 'Offline', icon: '🔴', color: 'var(--accent-rose)' },
];

const PRESSURE_UNITS = ['Pa', 'mbar', 'kPa', 'bar'];
const TEMP_UNITS = ['°C', 'K'];

function ScientificInput({ label, state, onChange, units }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input 
          type="number" 
          step="any"
          value={state.base} 
          onChange={e => onChange({ ...state, base: e.target.value })}
          placeholder="0.0"
          className="flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <span className="font-semibold shrink-0" style={{ color: 'var(--text-muted)' }}>E</span>
        <input 
          type="number" 
          value={state.exp} 
          onChange={e => onChange({ ...state, exp: e.target.value })}
          placeholder="-0"
          className="w-20 shrink-0 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <select 
          value={state.unit} 
          onChange={e => onChange({ ...state, unit: e.target.value })}
          className="w-20 shrink-0 px-2 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function LoggingPage() {
  const [equipment, setEquipment] = useState([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [selectedEqName, setSelectedEqName] = useState('');
  
  const [status, setStatus] = useState('good');
  const [observations, setObservations] = useState('');
  
  const defaultPressure = { base: '', exp: '', unit: 'Pa' };
  const [telemetry, setTelemetry] = useState({
    systemVacuum: { ...defaultPressure },
    processVacuum: { ...defaultPressure },
    forelineVacuum: { ...defaultPressure },
    installedGauge: { ...defaultPressure },
    connectMachine: { ...defaultPressure },
    temperature: { value: '', unit: '°C' }
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.getEquipment().then(d => {
      const active = (d.equipment || []).filter(e => e.is_active);
      setEquipment(active);
      if (active.length) {
        // Try to default to Magnetron Sputtering
        const mag = active.find(e => e.name.toLowerCase().includes('magnetron'));
        if (mag) {
          setEquipmentId(mag.id);
          setSelectedEqName(mag.name);
        } else {
          setEquipmentId(active[0].id);
          setSelectedEqName(active[0].name);
        }
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleEqChange = (e) => {
    const val = e.target.value;
    setEquipmentId(val);
    const eq = equipment.find(eq => eq.id.toString() === val);
    setSelectedEqName(eq ? eq.name : '');
  };

  const updateTelemetry = (key, val) => {
    setTelemetry(prev => ({ ...prev, [key]: val }));
  };

  const formatScientific = (obj) => {
    if (!obj.base && !obj.exp) return '-';
    const base = obj.base || '0';
    const exp = obj.exp ? `E${obj.exp}` : '';
    return `${base}${exp} ${obj.unit}`;
  };

  const formatTemp = (obj) => {
    if (!obj.value) return '-';
    return `${obj.value} ${obj.unit}`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!equipmentId || !status) return;
    setSubmitting(true); setMessage(null);
    
    const isMag = selectedEqName.toLowerCase().includes('magnetron');
    
    const payload = {
      equipment_id: Number(equipmentId),
      machine_status: status,
      observations: observations,
    };

    if (isMag) {
      payload.system_vacuum = formatScientific(telemetry.systemVacuum);
      payload.process_vacuum = formatScientific(telemetry.processVacuum);
      payload.foreline_vacuum = formatScientific(telemetry.forelineVacuum);
      payload.installed_gauge = formatScientific(telemetry.installedGauge);
      payload.connect_machine = formatScientific(telemetry.connectMachine);
      payload.temperature = formatTemp(telemetry.temperature);
    }

    try {
      await api.createLog(payload);
      setMessage({ type: 'success', text: 'Session log recorded successfully!' });
      setObservations('');
      setTelemetry({
        systemVacuum: { ...defaultPressure },
        processVacuum: { ...defaultPressure },
        forelineVacuum: { ...defaultPressure },
        installedGauge: { ...defaultPressure },
        connectMachine: { ...defaultPressure },
        temperature: { value: '', unit: '°C' }
      });
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
    finally { setSubmitting(false); }
  }

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 4000); return () => clearTimeout(t); } }, [message]);

  const isMag = selectedEqName.toLowerCase().includes('magnetron');

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

      <div className="rounded-xl p-6 sm:p-8 animate-fade-in max-w-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Equipment</label>
              <select value={equipmentId} onChange={handleEqChange}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none cursor-pointer"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>

            {isMag && (
              <div className="p-5 rounded-xl" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--accent-cyan)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-cyan)', boxShadow: 'var(--shadow-glow-cyan)' }} />
                  Magnetron Sputtering Telemetry
                </h3>
                <div className="flex flex-col gap-4">
                  <ScientificInput label="System Vacuum Degree" state={telemetry.systemVacuum} onChange={(s) => updateTelemetry('systemVacuum', s)} units={PRESSURE_UNITS} />
                  <ScientificInput label="Process Vacuum Degree" state={telemetry.processVacuum} onChange={(s) => updateTelemetry('processVacuum', s)} units={PRESSURE_UNITS} />
                  <ScientificInput label="Foreline Vacuum Degree" state={telemetry.forelineVacuum} onChange={(s) => updateTelemetry('forelineVacuum', s)} units={PRESSURE_UNITS} />
                  <ScientificInput label="Installed Gauge Degree" state={telemetry.installedGauge} onChange={(s) => updateTelemetry('installedGauge', s)} units={PRESSURE_UNITS} />
                  <ScientificInput label="Connect Machine Reading" state={telemetry.connectMachine} onChange={(s) => updateTelemetry('connectMachine', s)} units={PRESSURE_UNITS} />
                  
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Temperature</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="any"
                        value={telemetry.temperature.value} 
                        onChange={e => updateTelemetry('temperature', { ...telemetry.temperature, value: e.target.value })}
                        placeholder="0.0"
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                      <select 
                        value={telemetry.temperature.unit} 
                        onChange={e => updateTelemetry('temperature', { ...telemetry.temperature, unit: e.target.value })}
                        className="w-24 px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        {TEMP_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Observations (Optional)</label>
              <textarea value={observations} onChange={e => setObservations(e.target.value)}
                placeholder="Describe any issues, measurements, or notes from your session..."
                rows={3} className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-y"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg text-sm font-semibold cursor-pointer mt-2"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Recording...' : '📝 Record Session Log'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg p-4 max-w-2xl" style={{ background: 'var(--accent-emerald-dim)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <p className="text-xs leading-relaxed" style={{ color: '#6ee7b7' }}>⏱️ The timestamp and your identity will be automatically recorded by the server. Your log will appear instantly on the unified calendar and live dashboards.</p>
      </div>
    </div>
  );
}
