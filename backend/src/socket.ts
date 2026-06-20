import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from './config/env';

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // Simple in-memory structure to track locked seats across the application
  // In production, this MUST be Redis.
  const lockedSeatsByEvent: Record<string, Record<string, { socketId: string, timeoutId: NodeJS.Timeout }>> = {};

  io.on('connection', (socket) => {
    
    socket.on('join_event', (eventId: string) => {
      socket.join(eventId);
      // Send current locks to the user who just joined
      if (lockedSeatsByEvent[eventId]) {
        // Strip timeoutId before sending
        const locksWithoutTimeout: Record<string, { socketId: string }> = {};
        for (const [sId, lock] of Object.entries(lockedSeatsByEvent[eventId])) {
          locksWithoutTimeout[sId] = { socketId: lock.socketId };
        }
        socket.emit('initial_locks', locksWithoutTimeout);
      }
    });

    socket.on('leave_event', (eventId: string) => {
      socket.leave(eventId);
      // Clean up locks by this socket
      if (lockedSeatsByEvent[eventId]) {
        for (const seatId in lockedSeatsByEvent[eventId]) {
          if (lockedSeatsByEvent[eventId][seatId].socketId === socket.id) {
            clearTimeout(lockedSeatsByEvent[eventId][seatId].timeoutId);
            delete lockedSeatsByEvent[eventId][seatId];
            io.to(eventId).emit('seat_unlocked', { seatId, by: socket.id });
          }
        }
      }
    });

    socket.on('lock_seat', (data: { eventId: string; seatId: string }) => {
      const { eventId, seatId } = data;
      if (!lockedSeatsByEvent[eventId]) {
        lockedSeatsByEvent[eventId] = {};
      }
      
      // If already locked, clear existing timeout
      if (lockedSeatsByEvent[eventId][seatId]) {
        clearTimeout(lockedSeatsByEvent[eventId][seatId].timeoutId);
      }

      const timeoutId = setTimeout(() => {
        if (lockedSeatsByEvent[eventId]?.[seatId]) {
          delete lockedSeatsByEvent[eventId][seatId];
          io.to(eventId).emit('seat_unlocked', { seatId, by: 'system_timeout' });
        }
      }, env.SEAT_LOCK_TIMEOUT_SECONDS * 1000);

      lockedSeatsByEvent[eventId][seatId] = { socketId: socket.id, timeoutId };
      socket.to(eventId).emit('seat_locked', { seatId, by: socket.id });
    });

    socket.on('unlock_seat', (data: { eventId: string; seatId: string }) => {
      const { eventId, seatId } = data;
      if (lockedSeatsByEvent[eventId] && lockedSeatsByEvent[eventId][seatId]?.socketId === socket.id) {
        clearTimeout(lockedSeatsByEvent[eventId][seatId].timeoutId);
        delete lockedSeatsByEvent[eventId][seatId];
        socket.to(eventId).emit('seat_unlocked', { seatId, by: socket.id });
      }
    });

    socket.on('disconnect', () => {
      // Clean up any seats this socket had locked
      for (const eventId in lockedSeatsByEvent) {
        for (const seatId in lockedSeatsByEvent[eventId]) {
          if (lockedSeatsByEvent[eventId][seatId].socketId === socket.id) {
            clearTimeout(lockedSeatsByEvent[eventId][seatId].timeoutId);
            delete lockedSeatsByEvent[eventId][seatId];
            io.to(eventId).emit('seat_unlocked', { seatId, by: socket.id });
          }
        }
      }
    });
  });

  return io;
}

export function emitSeatBooked(eventId: string, seats: string[]) {
  if (io) {
    io.to(eventId).emit('seats_booked', { seats });
  }
}

export function emitSeatUnlocked(eventId: string, seats: string[]) {
  if (io) {
    io.to(eventId).emit('seats_unlocked', { seats });
  }
}
