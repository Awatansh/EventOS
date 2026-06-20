import React, { useEffect } from 'react';
import type { Booking } from '../../types';
import { formatDate } from '../../utils/formatDate';

interface Props {
  booking: Booking;
  onClose: () => void;
}

export const TicketModal: React.FC<Props> = ({ booking, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxWidth: '400px', background: 'var(--color-bg)', padding: 0 }}>
        {/* Ticket Header */}
        <div style={{ background: 'var(--color-accent)', padding: 'var(--space-6)', textAlign: 'center', color: 'white', borderRadius: '10px 10px 0 0' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{booking.event.name}</h2>
          <p style={{ opacity: 0.8, fontSize: 'var(--text-sm)' }}>EventOS Official Ticket</p>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: 'var(--space-4)' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Date & Time</p>
              <p style={{ fontWeight: 600 }}>{formatDate(booking.event.startsAt)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</p>
              <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-error'}`}>{booking.status}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed var(--color-border)', paddingBottom: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Venue</p>
            <p style={{ fontWeight: 500 }}>{booking.event.venue}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Seats</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-accent)' }}>
                {booking.seats?.join(', ') || 'N/A'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Booking ID</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{booking.id.split('-')[0].toUpperCase()}</p>
            </div>
          </div>

          {/* Barcode Placeholder */}
          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ 
              height: '60px', 
              background: 'repeating-linear-gradient(90deg, var(--color-text-primary) 0, var(--color-text-primary) 2px, transparent 2px, transparent 4px, var(--color-text-primary) 4px, var(--color-text-primary) 8px, transparent 8px, transparent 10px)',
              opacity: booking.status === 'confirmed' ? 0.8 : 0.2,
              marginBottom: 'var(--space-2)'
            }}></div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>Scan at entry</p>
          </div>
        </div>

        {/* Print Action */}
        <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderRadius: '0 0 10px 10px', display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()} disabled={booking.status !== 'confirmed'}>
            Print Ticket
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
