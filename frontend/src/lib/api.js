/**
 * API utility — centralized fetch wrapper with JWT auth headers.
 */

const BASE_URL = 'https://nurdam-cleanroom-api.abdallahussein713.workers.dev';

function getToken() {
  return localStorage.getItem('nurdam_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  seedAdmin: () =>
    request('/auth/seed-admin', { method: 'POST' }),

  // Users
  getUsers: () => request('/v1/users'),
  createUser: (name) =>
    request('/v1/users', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Equipment
  getEquipment: () => request('/v1/equipment'),
  addEquipment: (name) =>
    request('/v1/equipment', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  toggleEquipment: (id, is_active) =>
    request(`/v1/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    }),

  // Appointments
  getAppointments: () => request('/v1/appointments'),
  createAppointment: (equipment_id, start_time, end_time) =>
    request('/v1/appointments', {
      method: 'POST',
      body: JSON.stringify({ equipment_id, start_time, end_time }),
    }),
  updateAppointment: (id, status) =>
    request(`/v1/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Logs
  getLogs: () => request('/v1/logs'),
  createLog: (equipment_id, machine_status, observations) =>
    request('/v1/logs', {
      method: 'POST',
      body: JSON.stringify({ equipment_id, machine_status, observations }),
    }),

  // Calendar
  getCalendarEvents: () => request('/v1/calendar-events'),

  // Stats
  getStats: () => request('/v1/stats'),
};
