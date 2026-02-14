// src/server.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/index.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';
import telegramBot from './services/TelegramBot.js';

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: config.corsOrigin || '*',
        credentials: true
      }
    });

    // Attach io to app so routes can access it
    app.set('io', io);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Client connected');

      // Owner joins their business room
      socket.on('join:business', (businessId) => {
        socket.join(`business:${businessId}`);
        logger.info({ socketId: socket.id, businessId }, 'Owner joined business room');
      });

      // Customer joins session room
      socket.on('join:session', (sessionId) => {
        socket.join(`session:${sessionId}`);
        logger.info({ socketId: socket.id, sessionId }, 'Customer joined session room');
      });

      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Client disconnected');
      });
    });

    // Start HTTP server
    httpServer.listen(config.port, async () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🏥 Health check: http://localhost:${config.port}/health`);
      logger.info(`🔌 Socket.IO enabled on port ${config.port}`);
      logger.info(`📡 API endpoints: http://localhost:${config.port}/api`);
      logger.info('='.repeat(50));

      // Start Telegram bot
      try {
        await telegramBot.start();
      } catch (err) {
        logger.error({ err: err.message }, 'Failed to start Telegram bot');
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutdown signal received, closing gracefully');

      // Stop Telegram bot
      try {
        await telegramBot.stop();
      } catch (err) {
        logger.error({ err: err.message }, 'Error stopping Telegram bot');
      }

      httpServer.close(() => {
        logger.info('HTTP server closed');
        io.close(() => {
          logger.info('Socket.IO server closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
