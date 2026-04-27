import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import { authMiddleware, adminOnly } from './middleware/auth';
import {
  hashPassword,
  verifyPassword,
  generatePassword,
  generateUsername,
} from './utils/crypto';

// ─── Type Definitions ────────────────────────────────────────────────
export type Env = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    CORS_ORIGIN: string;
  };
};

const app = new Hono<Env>();

// ─── CORS ────────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Health Check ────────────────────────────────────────────────────
app.get('/', (c) => c.json({ status: 'ok', service: 'NÜRDAM Cleanroom API' }));

// ═════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/seed-admin
 * One-time endpoint to create the initial boss admin user.
 */
app.post('/api/auth/seed-admin', async (c) => {
  const db = c.env.DB;

  const existing = await db
    .prepare('SELECT id FROM Users WHERE is_boss = 1')
    .first();

  if (existing) {
    return c.json({ error: 'Boss admin already exists' }, 409);
  }

  const password = 'admin123';
  const passwordHash = await hashPassword(password);

  await db
    .prepare(
      'INSERT INTO Users (name, username, password_hash, password_plain, role, is_boss) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind('Dr. Ramazan', 'dr.ramazan', passwordHash, password, 'admin', 1)
    .run();

  // Also seed equipment if not already present
  const equipmentCount = await db.prepare('SELECT COUNT(*) as count FROM Equipment').first<{count: number}>();
  if (!equipmentCount || equipmentCount.count === 0) {
    await db.prepare('INSERT INTO Equipment (name, is_active) VALUES (?, 1)').bind('FR Magnetic Sputtering').run();
    await db.prepare('INSERT INTO Equipment (name, is_active) VALUES (?, 1)').bind('E-Beam device').run();
  }

  return c.json({
    message: 'Boss admin created successfully',
    credentials: {
      username: 'dr.ramazan',
      password: password,
    },
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT. Blocked users cannot log in.
 */
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json<{
    username: string;
    password: string;
  }>();

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, name, username, password_hash, role, is_blocked, is_boss FROM Users WHERE username = ?'
  )
    .bind(username)
    .first<{
      id: number;
      name: string;
      username: string;
      password_hash: string;
      role: string;
      is_blocked: number;
      is_boss: number;
    }>();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Check if user is blocked
  if (user.is_blocked) {
    return c.json({ error: 'Your account has been suspended. Contact the administrator.' }, 403);
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    is_boss: user.is_boss,
    iat: now,
    exp: now + 60 * 60 * 24, // 24 hours
  };

  const token = await sign(payload, c.env.JWT_SECRET, 'HS256');

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      is_boss: user.is_boss,
    },
  });
});

// ═════════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES — Require Auth
// ═════════════════════════════════════════════════════════════════════
const api = new Hono<Env>();

// Apply auth middleware to all /api/v1 routes
api.use('*', authMiddleware());

// ─── USER MANAGEMENT (Admin Only) ───────────────────────────────────

/**
 * GET /api/v1/users — List all users (includes password_plain for admin view)
 */
api.get('/users', adminOnly(), async (c) => {
  const db = c.env.DB;
  const { results } = await db
    .prepare(
      'SELECT id, name, username, password_plain, role, is_blocked, is_boss, created_at FROM Users ORDER BY created_at DESC'
    )
    .all();
  return c.json({ users: results });
});

/**
 * POST /api/v1/users — Create a new user (admin creates users)
 * Body: { name: string, role?: string }
 * Returns: auto-generated username and password
 */
api.post('/users', adminOnly(), async (c) => {
  const { name, role } = await c.req.json<{ name: string; role?: string }>();

  if (!name || name.trim().length === 0) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const userRole = role === 'admin' ? 'admin' : 'user';
  const username = generateUsername(name);
  const password = generatePassword(12);
  const passwordHash = await hashPassword(password);

  try {
    const result = await c.env.DB.prepare(
      'INSERT INTO Users (name, username, password_hash, password_plain, role) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(name.trim(), username, passwordHash, password, userRole)
      .run();

    return c.json({
      message: 'User created successfully',
      user: {
        id: result.meta.last_row_id,
        name: name.trim(),
        username,
        password,
        role: userRole,
      },
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'Username already exists, try again' }, 409);
    }
    throw err;
  }
});

/**
 * PATCH /api/v1/users/:id — Update a user (name, username, role, password, is_blocked)
 * Boss admin is protected from modification by other admins.
 */
api.patch('/users/:id', adminOnly(), async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');
  const body = await c.req.json<{
    name?: string;
    username?: string;
    role?: string;
    password?: string;
    is_blocked?: boolean;
  }>();

  const db = c.env.DB;

  // Fetch the target user
  const target = await db
    .prepare('SELECT id, is_boss FROM Users WHERE id = ?')
    .bind(id)
    .first<{ id: number; is_boss: number }>();

  if (!target) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Protect the boss admin: only the boss can edit their own account
  if (target.is_boss && payload.sub !== id) {
    return c.json({ error: 'Cannot modify the boss admin account' }, 403);
  }

  // Non-boss admins cannot change role to/from admin for the boss
  if (target.is_boss && body.role && body.role !== 'admin') {
    return c.json({ error: 'Cannot change the boss admin role' }, 403);
  }

  // Non-boss admins cannot block the boss
  if (target.is_boss && body.is_blocked !== undefined) {
    return c.json({ error: 'Cannot block the boss admin' }, 403);
  }

  // Build dynamic update
  const updates: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined && body.name.trim().length > 0) {
    updates.push('name = ?');
    values.push(body.name.trim());
  }

  if (body.username !== undefined && body.username.trim().length > 0) {
    updates.push('username = ?');
    values.push(body.username.trim());
  }

  if (body.role !== undefined && ['admin', 'user'].includes(body.role)) {
    updates.push('role = ?');
    values.push(body.role);
  }

  if (body.password !== undefined && body.password.length > 0) {
    const hash = await hashPassword(body.password);
    updates.push('password_hash = ?');
    values.push(hash);
    updates.push('password_plain = ?');
    values.push(body.password);
  }

  if (body.is_blocked !== undefined) {
    updates.push('is_blocked = ?');
    values.push(body.is_blocked ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  values.push(id);

  try {
    await db
      .prepare(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return c.json({ message: 'User updated successfully' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'Username already taken' }, 409);
    }
    throw err;
  }
});

/**
 * DELETE /api/v1/users/:id — Delete a user account
 * Boss admin cannot be deleted.
 */
api.delete('/users/:id', adminOnly(), async (c) => {
  const id = parseInt(c.req.param('id'));
  const payload = c.get('jwtPayload');
  const db = c.env.DB;

  const target = await db
    .prepare('SELECT id, is_boss FROM Users WHERE id = ?')
    .bind(id)
    .first<{ id: number; is_boss: number }>();

  if (!target) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (target.is_boss) {
    return c.json({ error: 'Cannot delete the boss admin account' }, 403);
  }

  // Cannot delete yourself
  if (payload.sub === id) {
    return c.json({ error: 'Cannot delete your own account' }, 400);
  }

  // Delete related data first (logs, appointments)
  await db.prepare('DELETE FROM Logs WHERE user_id = ?').bind(id).run();
  await db.prepare('DELETE FROM Appointments WHERE user_id = ?').bind(id).run();
  await db.prepare('DELETE FROM Users WHERE id = ?').bind(id).run();

  return c.json({ message: 'User deleted successfully' });
});

// ─── EQUIPMENT MANAGEMENT ───────────────────────────────────────────

/**
 * GET /api/v1/equipment — List all equipment
 */
api.get('/equipment', async (c) => {
  const db = c.env.DB;
  const { results } = await db
    .prepare('SELECT id, name, is_active, created_at FROM Equipment ORDER BY name')
    .all();
  return c.json({ equipment: results });
});

/**
 * POST /api/v1/equipment — Add new equipment (admin only)
 */
api.post('/equipment', adminOnly(), async (c) => {
  const { name } = await c.req.json<{ name: string }>();

  if (!name || name.trim().length === 0) {
    return c.json({ error: 'Equipment name is required' }, 400);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO Equipment (name, is_active) VALUES (?, 1)'
  )
    .bind(name.trim())
    .run();

  return c.json({
    message: 'Equipment added successfully',
    equipment: {
      id: result.meta.last_row_id,
      name: name.trim(),
      is_active: 1,
    },
  });
});

/**
 * PATCH /api/v1/equipment/:id — Update equipment name/status (admin only)
 */
api.patch('/equipment/:id', adminOnly(), async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{ is_active?: boolean; name?: string }>();

  const updates: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined && body.name.trim().length > 0) {
    updates.push('name = ?');
    values.push(body.name.trim());
  }

  if (body.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  values.push(id);

  try {
    await c.env.DB.prepare(`UPDATE Equipment SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return c.json({ message: 'Equipment updated successfully' });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'Equipment name already exists' }, 409);
    }
    throw err;
  }
});

// ─── APPOINTMENTS ───────────────────────────────────────────────────

/**
 * GET /api/v1/appointments — List appointments
 */
api.get('/appointments', async (c) => {
  const payload = c.get('jwtPayload');
  const db = c.env.DB;

  let query: string;
  let params: any[];

  if (payload.role === 'admin') {
    query = `
      SELECT a.id, a.user_id, a.equipment_id, a.start_time, a.end_time, a.status, a.created_at,
             u.name as user_name, u.username as user_username,
             e.name as equipment_name
      FROM Appointments a
      JOIN Users u ON a.user_id = u.id
      JOIN Equipment e ON a.equipment_id = e.id
      ORDER BY a.created_at DESC
    `;
    params = [];
  } else {
    query = `
      SELECT a.id, a.user_id, a.equipment_id, a.start_time, a.end_time, a.status, a.created_at,
             u.name as user_name, u.username as user_username,
             e.name as equipment_name
      FROM Appointments a
      JOIN Users u ON a.user_id = u.id
      JOIN Equipment e ON a.equipment_id = e.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `;
    params = [payload.sub];
  }

  const stmt = db.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  return c.json({ appointments: results });
});

/**
 * POST /api/v1/appointments — Create a new booking request
 */
api.post('/appointments', async (c) => {
  const payload = c.get('jwtPayload');
  const { equipment_id, start_time, end_time } = await c.req.json<{
    equipment_id: number;
    start_time: string;
    end_time: string;
  }>();

  if (!equipment_id || !start_time || !end_time) {
    return c.json({ error: 'Equipment, start time, and end time are required' }, 400);
  }

  const equipment = await c.env.DB.prepare(
    'SELECT id, is_active FROM Equipment WHERE id = ?'
  )
    .bind(equipment_id)
    .first<{ id: number; is_active: number }>();

  if (!equipment) {
    return c.json({ error: 'Equipment not found' }, 404);
  }
  if (!equipment.is_active) {
    return c.json({ error: 'Equipment is currently inactive' }, 400);
  }

  const conflict = await c.env.DB.prepare(
    `SELECT id FROM Appointments
     WHERE equipment_id = ? AND status = 'approved'
     AND start_time < ? AND end_time > ?`
  )
    .bind(equipment_id, end_time, start_time)
    .first();

  if (conflict) {
    return c.json(
      { error: 'Time slot conflicts with an existing approved appointment' },
      409
    );
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO Appointments (user_id, equipment_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(payload.sub, equipment_id, start_time, end_time, 'pending')
    .run();

  return c.json({
    message: 'Appointment submitted for approval',
    appointment: {
      id: result.meta.last_row_id,
      status: 'pending',
    },
  });
});

/**
 * PATCH /api/v1/appointments/:id — Approve or reject (admin only)
 */
api.patch('/appointments/:id', adminOnly(), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { status } = await c.req.json<{ status: 'approved' | 'rejected' }>();

  if (!['approved', 'rejected'].includes(status)) {
    return c.json({ error: 'Status must be "approved" or "rejected"' }, 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT id, status FROM Appointments WHERE id = ?'
  )
    .bind(id)
    .first<{ id: number; status: string }>();

  if (!existing) {
    return c.json({ error: 'Appointment not found' }, 404);
  }

  if (existing.status !== 'pending') {
    return c.json({ error: 'Can only update pending appointments' }, 400);
  }

  await c.env.DB.prepare('UPDATE Appointments SET status = ? WHERE id = ?')
    .bind(status, id)
    .run();

  return c.json({ message: `Appointment ${status} successfully` });
});

// ─── LOGS ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/logs — List session logs
 */
api.get('/logs', async (c) => {
  const payload = c.get('jwtPayload');
  const db = c.env.DB;

  let query: string;
  let params: any[];

  if (payload.role === 'admin') {
    query = `
      SELECT l.id, l.user_id, l.equipment_id, l.machine_status, l.observations, l.created_at,
             u.name as user_name, e.name as equipment_name
      FROM Logs l
      JOIN Users u ON l.user_id = u.id
      JOIN Equipment e ON l.equipment_id = e.id
      ORDER BY l.created_at DESC
    `;
    params = [];
  } else {
    query = `
      SELECT l.id, l.user_id, l.equipment_id, l.machine_status, l.observations, l.created_at,
             u.name as user_name, e.name as equipment_name
      FROM Logs l
      JOIN Users u ON l.user_id = u.id
      JOIN Equipment e ON l.equipment_id = e.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `;
    params = [payload.sub];
  }

  const stmt = db.prepare(query);
  const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  return c.json({ logs: results });
});

/**
 * POST /api/v1/logs — Create a session log
 */
api.post('/logs', async (c) => {
  const payload = c.get('jwtPayload');
  const { equipment_id, machine_status, observations } = await c.req.json<{
    equipment_id: number;
    machine_status: string;
    observations?: string;
  }>();

  if (!equipment_id || !machine_status) {
    return c.json({ error: 'Equipment and machine status are required' }, 400);
  }

  if (!['good', 'needs maintenance', 'offline'].includes(machine_status)) {
    return c.json({ error: 'Invalid machine status' }, 400);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO Logs (user_id, equipment_id, machine_status, observations) VALUES (?, ?, ?, ?)'
  )
    .bind(payload.sub, equipment_id, machine_status, observations || null)
    .run();

  return c.json({
    message: 'Log entry created successfully',
    log: {
      id: result.meta.last_row_id,
    },
  });
});

// ─── UNIFIED CALENDAR EVENTS ────────────────────────────────────────

api.get('/calendar-events', async (c) => {
  const db = c.env.DB;

  const { results: appointments } = await db
    .prepare(
      `SELECT a.id, a.start_time, a.end_time, a.status,
              u.name as user_name, e.name as equipment_name
       FROM Appointments a
       JOIN Users u ON a.user_id = u.id
       JOIN Equipment e ON a.equipment_id = e.id
       WHERE a.status = 'approved'
       ORDER BY a.start_time`
    )
    .all<{
      id: number;
      start_time: string;
      end_time: string;
      status: string;
      user_name: string;
      equipment_name: string;
    }>();

  const { results: logs } = await db
    .prepare(
      `SELECT l.id, l.machine_status, l.observations, l.created_at,
              u.name as user_name, e.name as equipment_name
       FROM Logs l
       JOIN Users u ON l.user_id = u.id
       JOIN Equipment e ON l.equipment_id = e.id
       ORDER BY l.created_at`
    )
    .all<{
      id: number;
      machine_status: string;
      observations: string;
      created_at: string;
      user_name: string;
      equipment_name: string;
    }>();

  const appointmentEvents = (appointments || []).map((a) => ({
    id: `appt-${a.id}`,
    title: `${a.equipment_name} — ${a.user_name}`,
    start: a.start_time,
    end: a.end_time,
    type: 'appointment',
    color: '#06b6d4',
    textColor: '#ffffff',
    extendedProps: {
      eventType: 'appointment',
      equipment: a.equipment_name,
      user: a.user_name,
      status: a.status,
    },
  }));

  const statusIcons: Record<string, string> = {
    good: '✅',
    'needs maintenance': '🔧',
    offline: '🔴',
  };

  const statusColors: Record<string, string> = {
    good: '#10b981',
    'needs maintenance': '#f59e0b',
    offline: '#ef4444',
  };

  const logEvents = (logs || []).map((l) => ({
    id: `log-${l.id}`,
    title: `${statusIcons[l.machine_status] || '📋'} ${l.equipment_name}`,
    start: l.created_at,
    type: 'log',
    color: statusColors[l.machine_status] || '#6b7280',
    textColor: '#ffffff',
    allDay: false,
    display: 'list-item',
    extendedProps: {
      eventType: 'log',
      equipment: l.equipment_name,
      user: l.user_name,
      machineStatus: l.machine_status,
      observations: l.observations,
    },
  }));

  return c.json({ events: [...appointmentEvents, ...logEvents] });
});

// ─── DASHBOARD STATS ────────────────────────────────────────────────

api.get('/stats', async (c) => {
  const payload = c.get('jwtPayload');
  const db = c.env.DB;

  const pendingCount = await db
    .prepare("SELECT COUNT(*) as count FROM Appointments WHERE status = 'pending'")
    .first<{ count: number }>();

  const activeEquipment = await db
    .prepare('SELECT COUNT(*) as count FROM Equipment WHERE is_active = 1')
    .first<{ count: number }>();

  const totalUsers = await db
    .prepare("SELECT COUNT(*) as count FROM Users WHERE role = 'user'")
    .first<{ count: number }>();

  const totalLogs = await db
    .prepare('SELECT COUNT(*) as count FROM Logs')
    .first<{ count: number }>();

  const recentLogs = await db
    .prepare(
      `SELECT l.id, l.machine_status, l.created_at, e.name as equipment_name, u.name as user_name
       FROM Logs l
       JOIN Equipment e ON l.equipment_id = e.id
       JOIN Users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT 5`
    )
    .all();

  return c.json({
    stats: {
      pending_appointments: pendingCount?.count || 0,
      active_equipment: activeEquipment?.count || 0,
      total_users: totalUsers?.count || 0,
      total_logs: totalLogs?.count || 0,
    },
    recent_logs: recentLogs.results,
  });
});

// ─── Mount protected routes ─────────────────────────────────────────
app.route('/api/v1', api);

export default app;