import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/shared/Navbar';
import { PageTransition } from '../components/shared/PageTransition';
import { AnimatedSection } from '../components/shared/AnimatedSection';
import { useBookings, useCancelBooking } from '../hooks/useBookings';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../components/shared/Toast';
import { AxiosError } from 'axios';

import { TicketModal } from '../components/shared/TicketModal';

export const MyBookingsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const queryParams: Record<string, string | number> = { limit: 20 };
  if (statusFilter) queryParams.status = statusFilter;

  const { data, isLoading } = useBookings(queryParams);
  const cancelBooking = useCancelBooking();
  const { addToast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [viewTicketFor, setViewTicketFor] = useState<any | null>(null);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    setCancellingId(bookingId);
    try {
      await cancelBooking.mutateAsync({ id: bookingId });
      addToast('success', 'Booking cancelled successfully');
    } catch (err) {
      const error = err as AxiosError<{ error: { message: string } }>;
      const msg = error.response?.data?.error?.message || 'Cancellation failed.';
      addToast('error', msg);
    } finally {
      setCancellingId(null);
    }
  };

  // Summary stats
  const confirmedBookings = data?.bookings?.filter(b => b.status === 'confirmed') || [];
  const totalSpent = confirmedBookings.reduce((acc, b) => acc + b.totalCents, 0);

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page">
          <div className="container">
            <div className="page-header">
              <h1 className="page-title">My Bookings</h1>
            </div>

            {/* Summary Stats */}
            {data?.bookings && data.bookings.length > 0 && (
              <AnimatedSection>
                <div className="summary-bar">
                  <div className="summary-item">
                    <div>
                      <div className="summary-item-value">{data.meta?.total || 0}</div>
                      <div className="summary-item-label">Total Bookings</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div>
                      <div className="summary-item-value" style={{ color: 'var(--color-success)' }}>
                        {confirmedBookings.length}
                      </div>
                      <div className="summary-item-label">Confirmed</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div>
                      <div className="summary-item-value">{formatCurrency(totalSpent)}</div>
                      <div className="summary-item-label">Total Spent</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            )}

            {/* Filter chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div className="filter-chips">
                {[
                  { label: 'All', value: undefined },
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Cancelled', value: 'cancelled' },
                ].map((filter) => (
                  <button
                    key={filter.label}
                    className={`filter-chip ${statusFilter === filter.value ? 'active' : ''}`}
                    onClick={() => setStatusFilter(filter.value)}
                    id={`filter-${filter.label.toLowerCase()}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              {data?.meta && (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {data.meta.total} booking{data.meta.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', gap: 'var(--space-6)', padding: 'var(--space-2)' }}>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton skeleton-title" style={{ marginBottom: '8px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                      </div>
                      <div className="skeleton" style={{ width: '100px', height: '24px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.bookings && data.bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {data.bookings.map((booking, i) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <div
                      className="card"
                      style={{ opacity: booking.status === 'cancelled' ? 0.6 : 1 }}
                      id={`booking-${booking.id}`}
                    >
                      <div className="booking-row">
                        <div className="booking-row-info">
                          <h3 className="booking-row-event">
                            <Link to={`/events/${booking.event.id}`} style={{ color: 'var(--color-text-primary)' }}>
                              {booking.event.name}
                            </Link>
                          </h3>
                          <div className="booking-row-meta">
                            <span>📅 {formatDate(booking.event.startsAt)}</span>
                            <span>📍 {booking.event.venue}</span>
                          </div>
                        </div>

                        <div className="booking-row-details">
                          <div className="booking-row-seats">{booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''}</div>
                          <div className="booking-row-total">{formatCurrency(booking.totalCents)}</div>
                        </div>

                        <div className="booking-row-actions">
                          <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-error'}`}>
                            {booking.status}
                          </span>
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setViewTicketFor(booking)}
                                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)' }}
                              >
                                View Ticket
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleCancel(booking.id)}
                                disabled={cancellingId === booking.id}
                                id={`cancel-${booking.id}`}
                                style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)' }}
                              >
                                {cancellingId === booking.id ? (
                                  <><div className="spinner" /> Cancelling</>
                                ) : (
                                  'Cancel Booking'
                                )}
                              </button>
                            </>
                          )}
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Booked {formatDate(booking.bookedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎫</div>
                <h2 className="empty-state-title">No bookings yet</h2>
                <p className="empty-state-text">You haven't booked any events. Start exploring!</p>
                <Link to="/events" className="btn btn-primary">
                  Browse Events →
                </Link>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Ticket Modal */}
      {viewTicketFor && (
        <TicketModal
          booking={viewTicketFor}
          onClose={() => setViewTicketFor(null)}
        />
      )}
    </>
  );
};
