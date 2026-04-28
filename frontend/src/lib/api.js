/**
 * API utility — centralized fetch wrapper with JWT auth headers.
 */

const BASE_URL = '/api';

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

  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Server Error (${response.status}): ${text || 'Invalid API response'}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
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
  createUser: (name, role) =>
    request('/v1/users', {
      method: 'POST',
      body: JSON.stringify({ name, role }),
    }),
  updateUser: (id, updates) =>
    request(`/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  deleteUser: (id) =>
    request(`/v1/users/${id}`, {
      method: 'DELETE',
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
  // Logs
  getLogs: () => request('/v1/logs'),
  createLog: (payload) =>
    request('/v1/logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Calendar
  getCalendarEvents: () => request('/v1/calendar-events'),

  // Stats
  getStats: () => request('/v1/stats'),
};