import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { initSocket } from '../socket';

// Helper to wait for a specific condition or timeout
const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Socket.io Seat Locking', () => {
  let ioServer: Server;
  let httpServer: HttpServer;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let port: number;

  beforeAll(async () => {
    httpServer = createServer();
    ioServer = initSocket(httpServer);
    
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        port = (httpServer.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
  });

  beforeEach(async () => {
    // Connect clients
    client1 = Client(`http://localhost:${port}`);
    client2 = Client(`http://localhost:${port}`);
    
    await Promise.all([
      new Promise<void>((resolve) => {
        client1.on('connect', resolve);
      }),
      new Promise<void>((resolve) => {
        client2.on('connect', resolve);
      })
    ]);
  });

  afterEach(() => {
    client1.disconnect();
    client2.disconnect();
  });

  it('client2 should receive seat_locked when client1 locks a seat', async () => {
    const eventId = 'event-1';
    const seatId = 'A1';

    client1.emit('join_event', eventId);
    client2.emit('join_event', eventId);

    // Wait a bit for joins to process
    await waitFor(50);

    const promise = new Promise<any>((resolve) => {
      client2.on('seat_locked', (data) => {
        resolve(data);
      });
    });

    client1.emit('lock_seat', { eventId, seatId });

    const data = await promise;
    expect(data.seatId).toBe(seatId);
    expect(data.by).toBe(client1.id);
  });

  it('client2 should receive initial_locks if joining after client1 locked a seat', async () => {
    const eventId = 'event-2';
    const seatId = 'A2';

    client1.emit('join_event', eventId);
    await waitFor(50);

    client1.emit('lock_seat', { eventId, seatId });
    await waitFor(50);

    const promise = new Promise<any>((resolve) => {
      client2.on('initial_locks', (locks) => {
        resolve(locks);
      });
    });

    client2.emit('join_event', eventId);

    const locks = await promise;
    expect(locks[seatId]).toBeDefined();
    expect(locks[seatId].socketId).toBe(client1.id);
  });

  it('client2 should receive seat_unlocked when client1 explicitly unlocks', async () => {
    const eventId = 'event-3';
    const seatId = 'A3';

    client1.emit('join_event', eventId);
    client2.emit('join_event', eventId);
    await waitFor(50);

    client1.emit('lock_seat', { eventId, seatId });
    await waitFor(50);

    const promise = new Promise<any>((resolve) => {
      client2.on('seat_unlocked', (data) => {
        resolve(data);
      });
    });

    client1.emit('unlock_seat', { eventId, seatId });

    const data = await promise;
    expect(data.seatId).toBe(seatId);
    expect(data.by).toBe(client1.id);
  });

  it('client2 should receive seat_unlocked for all of client1 seats when client1 disconnects', async () => {
    const eventId = 'event-4';
    const seatId1 = 'A4';
    const seatId2 = 'A5';

    client1.emit('join_event', eventId);
    client2.emit('join_event', eventId);
    await waitFor(50);

    client1.emit('lock_seat', { eventId, seatId: seatId1 });
    client1.emit('lock_seat', { eventId, seatId: seatId2 });
    await waitFor(50);

    const unlockedSeats: string[] = [];
    const promise = new Promise<void>((resolve) => {
      client2.on('seat_unlocked', (data) => {
        unlockedSeats.push(data.seatId);
        if (unlockedSeats.length === 2) {
          resolve();
        }
      });
    });

    client1.disconnect();

    await promise;
    expect(unlockedSeats).toContain(seatId1);
    expect(unlockedSeats).toContain(seatId2);
  });
});
