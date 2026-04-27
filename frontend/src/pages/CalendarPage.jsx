import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../lib/api';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const data = await api.getCalendarEvents();
      setEvents(data.events || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function handleEventClick(info) {
    const props = info.event.extendedProps;
    setSelectedEvent({
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...props,
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Unified Calendar</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All approved bookings and session logs in one view</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: '#06b6d4' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: '#10b981' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Log: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: '#f59e0b' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Log: Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ background: '#ef4444' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Log: Offline</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-cyan)' }} />
        </div>
      ) : (
        <div className="rounded-xl p-4 animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            aspectRatio={1.8}
            nowIndicator={true}
            dayMaxEvents={3}
            eventClassNames={(arg) => {
              return arg.event.extendedProps.eventType === 'log' ? ['log-event'] : [];
            }}
          />
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedEvent(null)}>
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold pr-4" style={{ color: 'var(--text-primary)' }}>{selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-xl cursor-pointer p-1"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                <span className="px-2 py-1 rounded text-xs font-medium" style={{
                  background: selectedEvent.eventType === 'appointment' ? 'var(--accent-cyan-dim)' : 'var(--accent-emerald-dim)',
                  color: selectedEvent.eventType === 'appointment' ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                }}>{selectedEvent.eventType === 'appointment' ? 'Booking' : 'Session Log'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Equipment:</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedEvent.equipment}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>User:</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedEvent.user}</span>
              </div>
              {selectedEvent.start && (
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Time:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {new Date(selectedEvent.start).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {selectedEvent.end && ` — ${new Date(selectedEvent.end).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              )}
              {selectedEvent.machineStatus && (
                <div className="flex items-center gap-3 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selectedEvent.machineStatus}</span>
                </div>
              )}
              {selectedEvent.observations && (
                <div className="text-sm">
                  <span className="block mb-1" style={{ color: 'var(--text-muted)' }}>Observations:</span>
                  <p className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {selectedEvent.observations}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
