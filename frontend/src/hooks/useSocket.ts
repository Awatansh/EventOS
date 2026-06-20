import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

export function useSocket(eventId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [lockedSeats, setLockedSeats] = useState<Record<string, { socketId: string, timestamp: number }>>({});
  const [dynamicallyBookedSeats, setDynamicallyBookedSeats] = useState<string[]>([]);
  const [dynamicallyUnlockedSeats, setDynamicallyUnlockedSeats] = useState<string[]>([]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join_event', eventId);
    });

    socketRef.current.on('initial_locks', (locks) => {
      setLockedSeats(locks);
    });

    socketRef.current.on('seat_locked', (data: { seatId: string, by: string }) => {
      setLockedSeats(prev => ({ ...prev, [data.seatId]: { socketId: data.by, timestamp: Date.now() } }));
    });

    socketRef.current.on('seat_unlocked', (data: { seatId: string, by: string }) => {
      setLockedSeats(prev => {
        const next = { ...prev };
        delete next[data.seatId];
        return next;
      });
    });

    socketRef.current.on('seats_booked', (data: { seats: string[] }) => {
      setDynamicallyBookedSeats(prev => [...prev, ...data.seats]);
      // Remove from locked
      setLockedSeats(prev => {
        const next = { ...prev };
        data.seats.forEach(s => delete next[s]);
        return next;
      });
    });

    socketRef.current.on('seats_unlocked', (data: { seats: string[] }) => {
      setDynamicallyUnlockedSeats(prev => [...prev, ...data.seats]);
      // Remove from booked if they were added dynamically
      setDynamicallyBookedSeats(prev => prev.filter(s => !data.seats.includes(s)));
    });

    return () => {
      socketRef.current?.emit('leave_event', eventId);
      socketRef.current?.disconnect();
    };
  }, [eventId]);

  const lockSeat = (seatId: string) => {
    socketRef.current?.emit('lock_seat', { eventId, seatId });
  };

  const unlockSeat = (seatId: string) => {
    socketRef.current?.emit('unlock_seat', { eventId, seatId });
  };

  return { lockedSeats, dynamicallyBookedSeats, dynamicallyUnlockedSeats, lockSeat, unlockSeat };
}
