import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Share2 } from 'lucide-react';
import { Navbar } from '../components/shared/Navbar';
import { PageTransition } from '../components/shared/PageTransition';
import { AnimatedSection } from '../components/shared/AnimatedSection';
import { useEvent } from '../hooks/useEvents';
import { formatDateRange } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { BookingModal } from './BookingModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import { CATEGORY_META } from '../types';
import { useImageLoader } from '../hooks/useImageLoader';

/** Countdown timer hook */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id!);
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const isImageLoaded = useImageLoader(event?.imageUrl);

  const countdown = useCountdown(event?.startsAt || new Date(Date.now() + 86400000).toISOString());
  const isUpcoming = event ? new Date(event.startsAt) > new Date() : false;

  const handleBookClick = () => {
    if (!isAuthenticated) {
      addToast('warning', 'Please sign in to book seats');
      return;
    }
    setShowModal(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    addToast('success', 'Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="page">
          <div className="container">
            <div className="skeleton" style={{ height: '280px', borderRadius: '12px', marginBottom: '32px' }} />
            <div className="detail-layout">
              <div>
                <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: '16px' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '8px' }} />
                <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '100px', marginTop: '24px' }} />
              </div>
              <div className="skeleton skeleton-card" style={{ height: '350px' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="page">
          <div className="container">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h2 className="empty-state-title">Event not found</h2>
              <p className="empty-state-text">This event doesn't exist or has been removed.</p>
              <Link to="/events" className="btn btn-primary">Browse Events</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const bookedPercentage = ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100;
  const availablePercentage = (event.availableSeats / event.totalSeats) * 100;
  const getBarColor = () => {
    if (availablePercentage > 50) return 'green';
    if (availablePercentage > 20) return 'amber';
    return 'red';
  };

  const isBookable = event.status === 'published' && event.availableSeats > 0;
  const categoryMeta = CATEGORY_META[event.category] || CATEGORY_META.conference;

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page">
          <div className="container">
            <Link to="/events" className="btn btn-ghost" style={{ marginBottom: 'var(--space-4)', display: 'inline-flex' }}>
              ← Back to Events
            </Link>

            {/* Hero Banner */}
            <AnimatedSection>
              <div
                className="detail-hero-banner"
                style={{
                  background: (isImageLoaded && event.imageUrl)
                    ? `linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%), url(${event.imageUrl}) center/cover no-repeat`
                    : categoryMeta.gradient
                }}
              >
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <span className="category-badge">{categoryMeta.emoji} {categoryMeta.label}</span>
                  <span className={`badge ${event.status === 'published' ? 'badge-success' : 'badge-error'}`}>
                    {event.status}
                  </span>
                </div>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }} id="event-name">
                  {event.name}
                </h1>
              </div>
            </AnimatedSection>

            <div className="detail-layout">
              {/* Left: Event Info */}
              <div>
                {/* Countdown */}
                {isUpcoming && (
                  <AnimatedSection delay={0.1}>
                    <div style={{ marginBottom: 'var(--space-6)' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                        Event starts in
                      </p>
                      <div className="countdown" style={{ justifyContent: 'flex-start' }}>
                        <div className="countdown-item">
                          <div className="countdown-value">{countdown.days}</div>
                          <div className="countdown-label">Days</div>
                        </div>
                        <div className="countdown-item">
                          <div className="countdown-value">{String(countdown.hours).padStart(2, '0')}</div>
                          <div className="countdown-label">Hours</div>
                        </div>
                        <div className="countdown-item">
                          <div className="countdown-value">{String(countdown.minutes).padStart(2, '0')}</div>
                          <div className="countdown-label">Min</div>
                        </div>
                        <div className="countdown-item">
                          <div className="countdown-value">{String(countdown.seconds).padStart(2, '0')}</div>
                          <div className="countdown-label">Sec</div>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                )}

                <AnimatedSection delay={0.2}>
                  <div className="detail-meta">
                    <div className="detail-meta-item">
                      <span className="detail-meta-icon" style={{ display: 'flex', alignItems: 'center' }}><Calendar size={20} color="var(--color-accent)" /></span>
                      <span className="detail-meta-value">
                        {formatDateRange(event.startsAt, event.endsAt)}
                      </span>
                    </div>
                    <div className="detail-meta-item">
                      <span className="detail-meta-icon" style={{ display: 'flex', alignItems: 'center' }}><MapPin size={20} color="var(--color-accent)" /></span>
                      <span>{event.venue}</span>
                    </div>
                    <div className="detail-meta-item">
                      <span className="detail-meta-icon" style={{ display: 'flex', alignItems: 'center' }}><DollarSign size={20} color="var(--color-accent)" /></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {formatCurrency(event.priceCents, event.currency)} per seat
                      </span>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Share & Actions */}
                <AnimatedSection delay={0.25}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                    <button className="share-btn" onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Share2 size={16} /> {copied ? 'Copied!' : 'Share Event'}
                    </button>
                  </div>
                </AnimatedSection>

                {event.description && (
                  <AnimatedSection delay={0.3}>
                    <div className="detail-description">
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
                        About this event
                      </h2>
                      <p>{event.description}</p>
                    </div>
                  </AnimatedSection>
                )}
              </div>

              {/* Right: Booking Sidebar */}
              <AnimatedSection delay={0.15} direction="right">
                <div className="booking-sidebar">
                  <div className="card booking-sidebar-card">
                    {/* Availability Bar */}
                    <div>
                      <div className="availability-bar" style={{ height: '8px' }}>
                        <div
                          className={`availability-bar-fill ${getBarColor()}`}
                          style={{ width: `${bookedPercentage}%` }}
                        />
                      </div>
                      <div className="availability-info" style={{ marginTop: 'var(--space-3)' }}>
                        <span>{event.totalSeats - event.availableSeats} / {event.totalSeats} booked</span>
                      </div>
                      <p className="booking-sidebar-available" style={{
                        color: getBarColor() === 'green' ? 'var(--color-success)' :
                          getBarColor() === 'amber' ? 'var(--color-warning)' : 'var(--color-error)'
                      }}>
                        {event.availableSeats} seats available
                      </p>
                    </div>

                    <hr className="divider" />

                    {/* Price */}
                    <div className="booking-sidebar-price">
                      {formatCurrency(event.priceCents, event.currency)}
                    </div>
                    <p className="price-per-seat">per seat</p>

                    <hr className="divider" />

                    {/* Book Button */}
                    <button
                      className="btn btn-primary btn-full btn-lg"
                      onClick={handleBookClick}
                      disabled={!isBookable}
                      id="book-seats-btn"
                    >
                      {!isBookable
                        ? event.availableSeats === 0 ? 'Sold Out' : 'Not Available'
                        : 'Book Seats'
                      }
                    </button>
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      textAlign: 'center',
                      marginTop: 'var(--space-3)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      Max 10 seats per booking
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Booking Modal */}
      {showModal && (
        <BookingModal
          event={event}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
