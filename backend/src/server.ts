import { createApp } from './app';
import { env } from './config/env';
import { testConnection, closePool } from './config/db';

/**
 * Process entrypoint — starts Express server with graceful shutdown.
 */
async function main() {
  // Validate DB connection on startup
  await testConnection();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 EventOS API running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Attach WebSockets
  const { initSocket } = require('./socket');
  initSocket(server);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await closePool();
      console.log('👋 Server closed. Goodbye!');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time. Forcing shutdown.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
