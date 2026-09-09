// Standalone JSON Server runner.
// Usage: npm run server
// Serves the mock REST API from db.json on http://localhost:3001
import jsonServer from 'json-server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

const PORT = process.env.PORT || 3001;

const httpServer = server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});

// Surface startup problems clearly (e.g. the port is already taken)
// instead of crashing with a raw stack trace.
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[api] Port ${PORT} is already in use. ` +
        'Stop the other process using it, or start this server on another port with PORT=<port>.'
    );
    process.exit(1);
  }
  console.error('[api] Server error:', error);
  process.exit(1);
});