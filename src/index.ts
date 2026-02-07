import { createApp } from './server.js';
import { getDatabase, closeDatabase } from './db/client.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const db = getDatabase();
const app = createApp({ db });

const server = app.listen(PORT, () => {
  console.log(`User service listening on port ${PORT}`);
});

function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
