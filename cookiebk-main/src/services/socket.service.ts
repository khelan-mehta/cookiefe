import { Server as SocketServer, Socket } from 'socket.io';
import { Server } from 'http';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';
import { LocationUpdate } from '../types';

interface ConnectedUser {
  socketId: string;
  userId: string;
  role: string;
}

class SocketService {
  private io: SocketServer | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();

  initialize(server: Server): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = verifyToken(token);
        socket.data.user = decoded;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.io initialized');
  }

  private handleConnection(socket: Socket): void {
    const { userId, role } = socket.data.user;

    this.connectedUsers.set(userId, {
      socketId: socket.id,
      userId,
      role,
    });

    logger.debug(`User connected: ${userId}`);

    socket.on('join-distress', (distressId: string) => {
      socket.join(`distress:${distressId}`);
      logger.debug(`User ${userId} joined distress room: ${distressId}`);
    });

    socket.on('leave-distress', (distressId: string) => {
      socket.leave(`distress:${distressId}`);
    });

    socket.on('location-update', (data: LocationUpdate) => {
      this.broadcastLocationUpdate(data);
    });

    socket.on('disconnect', () => {
      this.connectedUsers.delete(userId);
      logger.debug(`User disconnected: ${userId}`);
    });
  }

  broadcastLocationUpdate(data: LocationUpdate): void {
    if (!this.io) return;
    this.io.to(`distress:${data.distressId}`).emit('location-updated', data);
  }

  notifyNewDistress(distressId: string, location: [number, number]): void {
    if (!this.io) return;
    // Broadcast to all connected vets
    this.connectedUsers.forEach((user) => {
      if (user.role === 'vet') {
        this.io?.to(user.socketId).emit('new-distress', { distressId, location });
      }
    });
  }

  notifyVetResponse(distressId: string, userId: string, response: object): void {
    if (!this.io) return;
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit('vet-response', { distressId, response });
    }
    this.io.to(`distress:${distressId}`).emit('distress-updated', { distressId });
  }

  notifyVetSelected(
    distressId: string,
    selectedVetId: string,
    otherVetIds: string[]
  ): void {
    if (!this.io) return;

    const selectedVet = this.connectedUsers.get(selectedVetId);
    if (selectedVet) {
      this.io.to(selectedVet.socketId).emit('response-accepted', { distressId });
    }

    otherVetIds.forEach((vetId) => {
      const vet = this.connectedUsers.get(vetId);
      if (vet) {
        this.io?.to(vet.socketId).emit('response-declined', { distressId });
      }
    });
  }

  notifyDistressResolved(distressId: string): void {
    if (!this.io) return;
    this.io.to(`distress:${distressId}`).emit('distress-resolved', { distressId });
  }

  getIO(): SocketServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
