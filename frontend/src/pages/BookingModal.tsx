import React, { useState, useEffect, useRef } from 'react';
import type { Event } from '../types';
import { formatDateTime } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { useCreateBooking } from '../hooks/useBookings';
import { useToast } from '../components/shared/Toast';
import { AxiosError } from 'axios';
import { useSocket } from '../hooks/useSocket';
import { SeatSelector } from '../components/shared/SeatSelector';
import { Calendar, DollarSign, X } from 'lucide-react';

interface Props {
  event: Event;
  onClose: () => void;
}

export const BookingModal: React.FC<Props> = ({ event, onClose }) => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [gaQuantity, setGaQuantity] = useState(1);
  const maxSeats = Math.min(10, event.availableSeats);
  
  const totalCents = event.isSeated 
    ? event.priceCents * selectedSeats.length
    : event.priceCents * gaQuantity;

  const createBooking = useCreateBooking();
  const { addToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { lockedSeats, dynamicallyBookedSeats, dynamicallyUnlockedSeats, lockSeat, unlockSeat } = useSocket(event.id);

  // Unmount logic: release any locked seats that weren't booked
  useEffect(() => {
    return () => {
      selectedSeats.forEach(seat => unlockSeat(seat));
    };
  }, [selectedSeats, unlockSeat]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = async () => {
    if (event.isSeated && selectedSeats.length === 0) {
      return addToast('error', 'Please select at least 1 seat');
    }
    if (!event.isSeated && gaQuantity < 1) {
      return addToast('error', 'Please select at least 1 ticket');
    }

    try {
      const seatsToBook = event.isSeated 
        ? selectedSeats 
        : Array.from({ length: gaQuantity }, () => `GA-${Date.now()}-${Math.random().toString(36).substring(7)}`);

      await createBooking.mutateAsync({
        eventId: event.id,
        seats: seatsToBook,
      });
      addToast('success', 'Booking confirmed! ✓');
      setSelectedSeats([]); 
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ error: { message: string } }>;
      const msg = error.response?.data?.error?.message || 'Booking failed. Please try again.';
      addToast('error', msg);
    }
  };

  const handleSeatToggle = (seatId: string, isSelected: boolean) => {
    if (isSelected) {
      if (selectedSeats.length >= maxSeats) {
        addToast('error', `You can only select up to ${maxSeats} seats.`);
        return;
      }
      setSelectedSeats(prev => [...prev, seatId]);
      lockSeat(seatId);
    } else {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
      unlockSeat(seatId);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '800px', width: '95%' }} ref={modalRef} id="booking-modal">
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Book Seats — {event.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal"><X size={24} /></button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div className="detail-meta-item">
              <span style={{ display: 'flex', alignItems: 'center' }}><Calendar size={18} color="var(--color-accent)" /></span>
              <span className="detail-meta-value">{formatDateTime(event.startsAt)}</span>
            </div>
            <div className="detail-meta-item">
              <span style={{ display: 'flex', alignItems: 'center' }}><DollarSign size={18} color="var(--color-accent)" /></span>
              <span className="detail-meta-value">
                {formatCurrency(event.priceCents, event.currency)} per seat
              </span>
            </div>
          </div>

          <hr className="divider" />

          {/* Seat Selector or Quantity Selector */}
          {event.isSeated ? (
            <SeatSelector
              event={event}
              selectedSeats={selectedSeats}
              onSeatToggle={handleSeatToggle}
              lockedSeats={lockedSeats}
              dynamicallyBookedSeats={dynamicallyBookedSeats}
              dynamicallyUnlockedSeats={dynamicallyUnlockedSeats}
            />
          ) : (
            <div style={{ padding: 'var(--space-6) 0', textAlign: 'center' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)' }}>General Admission</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setGaQuantity(Math.max(1, gaQuantity - 1))}
                  disabled={gaQuantity <= 1}
                >-</button>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, width: '40px' }}>{gaQuantity}</span>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setGaQuantity(Math.min(maxSeats, gaQuantity + 1))}
                  disabled={gaQuantity >= maxSeats}
                >+</button>
              </div>
              <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Max {maxSeats} tickets per booking
              </p>
            </div>
          )}

          <hr className="divider" style={{ marginTop: 'var(--space-6)' }} />

          {/* Price Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal ({event.isSeated ? selectedSeats.length : gaQuantity} × {formatCurrency(event.priceCents, event.currency)})</span>
              <span>{formatCurrency(totalCents, event.currency)}</span>
            </div>
            {event.isSeated && selectedSeats.length > 0 && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Seats: {selectedSeats.join(', ')}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700 }}>
              <span>Total</span>
              <span id="booking-total">{formatCurrency(totalCents, event.currency)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} id="cancel-booking-btn">
            Cancel
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleConfirm}
            disabled={createBooking.isPending || (event.isSeated && selectedSeats.length === 0)}
            style={{ flex: 1 }}
            id="confirm-booking-btn"
          >
            {createBooking.isPending ? (
              <><div className="spinner" /> Booking...</>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
