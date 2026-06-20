import React from 'react';
import type { Event } from '../../types';

interface SeatSelectorProps {
  event: Event;
  selectedSeats: string[];
  onSeatToggle: (seatId: string, isSelected: boolean) => void;
  lockedSeats: Record<string, any>;
  dynamicallyBookedSeats: string[];
  dynamicallyUnlockedSeats: string[];
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  event,
  selectedSeats,
  onSeatToggle,
  lockedSeats,
  dynamicallyBookedSeats,
  dynamicallyUnlockedSeats,
}) => {
  const layout = event.seatLayout || { rows: Math.ceil(event.totalSeats / 10), cols: 10 };
  const maxSeats = 10;

  const rows = layout.rows || 10;
  const cols = layout.cols || 10;
  
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // Base booked seats + dynamically booked - dynamically unlocked
  const currentBookedSeats = [
    ...(event.bookedSeats || []),
    ...dynamicallyBookedSeats
  ].filter(s => !dynamicallyUnlockedSeats.includes(s));

  return (
    <div className="seat-selector-container">
      <div className="screen">SCREEN THIS WAY</div>
      
      <div className="seat-grid" style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${cols}, 1fr)`,
        gap: '8px',
        justifyContent: 'center',
        margin: 'var(--space-4) 0',
        overflowX: 'auto',
        paddingBottom: 'var(--space-2)'
      }}>
        {Array.from({ length: rows }).map((_, r) => {
          const rowLabel = rowLabels[r % rowLabels.length];
          return (
            <React.Fragment key={r}>
              <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>
                {rowLabel}
              </div>
              {Array.from({ length: cols }).map((_, c) => {
                const seatNum = c + 1;
                const seatId = `${rowLabel}${seatNum}`;
                
                // If total seats is less than a perfect grid, hide extra seats
                if (r * cols + seatNum > event.totalSeats) {
                  return <div key={seatId} />;
                }

                const isBooked = currentBookedSeats.includes(seatId);
                const isSelected = selectedSeats.includes(seatId);
                const isLockedByOther = lockedSeats[seatId] && !isSelected;

                let stateClass = 'seat-available';
                if (isBooked) stateClass = 'seat-booked';
                else if (isSelected) stateClass = 'seat-selected';
                else if (isLockedByOther) stateClass = 'seat-locked';

                return (
                  <button
                    key={seatId}
                    type="button"
                    className={`seat ${stateClass}`}
                    disabled={isBooked || !!isLockedByOther}
                    onClick={() => {
                      if (!isSelected && selectedSeats.length >= maxSeats) return;
                      onSeatToggle(seatId, !isSelected);
                    }}
                    title={seatId}
                  >
                    {seatNum}
                  </button>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      <div className="seat-legend" style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="seat seat-available" style={{ width: '16px', height: '16px' }} /> Available
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="seat seat-selected" style={{ width: '16px', height: '16px' }} /> Selected
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="seat seat-locked" style={{ width: '16px', height: '16px' }} /> Locked
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="seat seat-booked" style={{ width: '16px', height: '16px' }} /> Booked
        </div>
      </div>
    </div>
  );
};
