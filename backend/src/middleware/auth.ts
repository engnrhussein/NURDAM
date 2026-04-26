import { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import type { Env } from '../index';

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches the decoded payload to context.
 */
export function authMiddleware() {
  return async (c: Context<{ Bindings: Env['Bindings'] }>, next: Next) => {
    const jwtMiddleware = jwt({
      secret: c.env.JWT_SECRET,
      alg: 'HS256',
    });
    return jwtMiddleware(c, next);
  };
}

/**
 * Admin-only middleware. Must be used AFTER authMiddleware.
 */
export function adminOnly() {
  return async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload');
    if (!payload || payload.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    await next();
  };
}
