import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { socketService } from './services/socket.service';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server
    const server = createServer(app);

    // Initialize Socket.io
    socketService.initialize(server);

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 Client URL: ${env.CLIENT_URL}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
