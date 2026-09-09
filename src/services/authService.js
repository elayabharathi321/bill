import api from './api';

/**
 * Authentication service.
 *
 * JSON Server has no auth endpoints, so login is simulated against the
 * `users` collection. However, the service is shaped like a real JWT flow:
 *
 *   - login() issues a JSON-Web-Token-style access token
 *     (header.payload.signature with `iat` / `exp` claims).
 *   - The token + user + expiry are persisted in localStorage.
 *   - getCurrentUser() validates the token expiry before restoring a session.
 *
 * When the Spring Boot + Spring Security backend is introduced, ONLY these
 * functions change (e.g. login() becomes `POST /auth/login` and returns a real
 * signed JWT). UI components keep calling authService.login() / logout() /
 * getCurrentUser() / getUsers() exactly as they do today.
 */

const TOKEN_KEY = 'billapp_token';
const SESSION_KEY = 'billapp_session';

// Mock session lifetimes (milliseconds). With a real backend these are driven
// by the token's `exp` claim returned by Spring Security.
const SESSION_DURATION = {
  // "Remember me": long-lived session.
  persistent: 30 * 24 * 60 * 60 * 1000, // 30 days
  // Default: short-lived session (browser-session simulation).
  session: 8 * 60 * 60 * 1000, // 8 hours
};

/*
 * Base64url helpers — used to build a JWT-shaped mock token.
 * When Spring Security lands, the token is created server-side and these
 * helpers are only needed to decode it for display/debug purposes.
 */
function base64UrlEncode(value) {
  return btoa(String(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeToken(token) {
  try {
    const [, payload] = String(token).split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Build a JWT-shaped mock token for the given user.
 * Structure matches a real JWT so swapping in Spring Security later only
 * requires changing this function to return the server-issued token.
 */
function issueToken(user, expiresAt, issuedAt) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(issuedAt / 1000),
    exp: Math.floor(expiresAt / 1000),
  };

  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`;

  // Placeholder signature — replaced by a real HMAC-signed JWT in Spring Boot.
  const signature = base64UrlEncode(`mock-signature:${user.id}:${payload.exp}`);
  return `${signingInput}.${signature}`;
}

/**
 * Persist the session (token + user + expiry) in localStorage.
 * The raw token is also stored under the legacy key used by the axios
 * request interceptor (src/services/api.js) so no other code changes.
 */
function writeSession({ token, user, expiresAt, rememberMe }) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token, user, expiresAt, rememberMe })
  );
  localStorage.setItem(TOKEN_KEY, token);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Log the user in.
 * @param {string} email
 * @param {string} password
 * @param {boolean} rememberMe When true the session lives longer (30 days),
 *   otherwise it behaves like a browser-session login (8 hours).
 */
export async function login(email, password, rememberMe = false) {
  // JSON Server simulation — becomes `POST /auth/login` on Spring Boot.
  const { data } = await api.get('/users', {
    params: { email, password },
  });

  const user = Array.isArray(data) ? data[0] : null;
  if (!user) {
    throw new Error('Invalid email or password');
  }
  if (user.status !== 'active') {
    throw new Error('This account is deactivated');
  }

  // Never persist the password, even in the mock.
  const { password: _password, ...safeUser } = user;

  const issuedAt = Date.now();
  const expiresIn = rememberMe ? SESSION_DURATION.persistent : SESSION_DURATION.session;
  const expiresAt = issuedAt + expiresIn;
  const token = issueToken(safeUser, expiresAt, issuedAt);

  writeSession({ token, user: safeUser, expiresAt, rememberMe: Boolean(rememberMe) });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: Math.floor(expiresIn / 1000),
    expiresAt,
    user: safeUser,
    rememberMe: Boolean(rememberMe),
  };
}

/**
 * Log out: clear the local session. When Spring Boot is introduced, also call
 * `POST /auth/logout` with the current token to revoke it server-side.
 */
export function logout() {
  clearSession();
}

/**
 * Restore the current user from the persisted session, if it is still valid.
 * Expiry is validated against the token's `exp` claim (exactly how a real
 * JWT would be checked); expired sessions are cleared automatically.
 */
export function getCurrentUser() {
  const session = readSession();
  if (!session || !session.token || !session.user) return null;

  const payload = decodeToken(session.token);
  const expiresAt = payload && payload.exp ? payload.exp * 1000 : session.expiresAt;
  if (!expiresAt || Date.now() > expiresAt) {
    clearSession();
    return null;
  }

  return session.user;
}

export function getToken() {
  const session = readSession();
  return (session && session.token) || localStorage.getItem(TOKEN_KEY) || null;
}

export function isAuthenticated() {
  return Boolean(getToken() && getCurrentUser());
}

/**
 * List users. Used by the Users module and by auth flows that need to
 * resolve another user's data. Becomes `GET /api/users` on Spring Boot.
 */
export function getUsers(params) {
  return api.get('/users', { params });
}