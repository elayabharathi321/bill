// One-command dev launcher.
// Starts BOTH the mock API (JSON Server) and the Vite frontend together.
// Usage: npm start
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath; // the currently running Node binary

const children = new Set();

function launch(args) {
  const child = spawn(node, args, { stdio: 'inherit' });
  children.add(child);
  child.on('exit', () => children.delete(child));
  return child;
}

/* ------------------------------------------------------------------ */
/* Pre-flight checks: fail fast with clear messages, never silently.   */
/* ------------------------------------------------------------------ */

// 1) db.json must be valid — a corrupt seed would crash the API on boot.
const dbPath = path.join(__dirname, 'db.json');
try {
  const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('the root of db.json must be a JSON object');
  }
} catch (error) {
  console.error(`[dev] Cannot start: db.json is invalid (${error.message}).`);
  console.error('[dev] Restore or fix db.json, then run "npm start" again.');
  process.exit(1);
}

// 2) Detect servers that are already running so "npm start" is idempotent
//    (running it twice must not crash with EADDRINUSE).
function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (inUse) => {
      socket.destroy();
      resolve(inUse);
    };
    socket.setTimeout(1000, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.connect(port, '127.0.0.1');
  });
}

const API_PORT = Number(process.env.PORT) || 3001;
const WEB_PORT = 5173;
const [apiInUse, webInUse] = await Promise.all([
  isPortInUse(API_PORT),
  isPortInUse(WEB_PORT),
]);

if (apiInUse && webInUse) {
  console.log('[dev] The mock API (3001) and frontend (5173) are already running.');
  console.log('[dev] Open http://localhost:5173 in your browser. Nothing new was started.');
  process.exit(0);
}

if (apiInUse) {
  console.log(
    `[dev] Port ${API_PORT} is already in use — assuming the mock API is already running.`
  );
} else {
  // Start the mock REST API first (the frontend needs it on :3001).
  console.log(`[dev] Starting the mock API on http://localhost:${API_PORT} ...`);
  launch([path.join(__dirname, 'server.js')]);
}

if (webInUse) {
  console.log('[dev] Port 5173 is already in use — Vite will pick the next free port.');
}

// Small delay so JSON Server binds before Vite starts and reports its URL.
setTimeout(() => {
  console.log('[dev] Starting the Vite frontend on http://localhost:5173 ...');
  launch([path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')]);
}, 1500);

let shuttingDown = false;
function shutdown(reason) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (reason) console.log(`\n${reason}`);
  for (const child of children) {
    try {
      child.kill();
    } catch {
      // process already exited
    }
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
process.on('exit', () => shutdown());