/**
 * Password hashing utilities using Web Crypto API (PBKDF2).
 * Compatible with Cloudflare Workers runtime.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a string in format: "salt:hash" (both base64 encoded).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  const saltBase64 = arrayBufferToBase64(salt.buffer);
  const hashBase64 = arrayBufferToBase64(derivedBits);

  return `${saltBase64}:${hashBase64}`;
}

/**
 * Verify a password against a stored hash.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltBase64, expectedHashBase64] = storedHash.split(':');
  if (!saltBase64 || !expectedHashBase64) return false;

  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  const derivedHash = arrayBufferToBase64(derivedBits);

  // Constant-time comparison
  if (derivedHash.length !== expectedHashBase64.length) return false;
  let result = 0;
  for (let i = 0; i < derivedHash.length; i++) {
    result |= derivedHash.charCodeAt(i) ^ expectedHashBase64.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a random password of given length.
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues, (v) => charset[v % charset.length]).join('');
}

/**
 * Generate a random username from a name.
 */
export function generateUsername(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${base}${suffix}`;
}
