import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Event } from '../../types';
import { CATEGORY_META } from '../../types';
import { formatCardDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { useImageLoader } from '../../hooks/useImageLoader';

interface Props {
  event: Event;
  index?: number;
}

/**
 * Event card with gradient category banner, availability bar, and staggered animation.
 */
export const EventCard: React.FC<Props> = ({ event, index = 0 }) => {
  const bookedPercentage = ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100;
  const availablePercentage = (event.availableSeats / event.totalSeats) * 100;
  const categoryMeta = CATEGORY_META[event.category] || CATEGORY_META.conference;
  const isImageLoaded = useImageLoader(event.imageUrl);

  const getBarColor = () => {
    if (availablePercentage > 50) return 'green';
    if (availablePercentage > 20) return 'amber';
    return 'red';
  };

  const getStatusBadge = () => {
    if (event.availableSeats === 0) return <span className="badge badge-error">Sold Out</span>;
    if (event.status === 'cancelled') return <span className="badge badge-error">Cancelled</span>;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card card-hover event-card" id={`event-card-${event.id}`}>
          {/* Category Gradient Banner or Image */}
          <div
            className="event-card-banner"
            style={{
              background: (isImageLoaded && event.imageUrl)
                ? `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%), url(${event.imageUrl}) center/cover no-repeat`
                : categoryMeta.gradient
            }}
          >
            <span className="category-badge">
              {categoryMeta.emoji} {categoryMeta.label}
            </span>
          </div>

          <div className="event-card-body">
            <div className="event-card-header">
              {getStatusBadge()}
              <span className="event-card-date">{formatCardDate(event.startsAt)}</span>
            </div>

            <h3 className="event-card-title">{event.name}</h3>
            <p className="event-card-venue">📍 {event.venue}</p>

            {/* Seat Availability Bar */}
            <div>
              <div className="availability-bar">
                <div
                  className={`availability-bar-fill ${getBarColor()}`}
                  style={{ width: `${bookedPercentage}%` }}
                />
              </div>
              <div className="availability-info">
                <span>{event.availableSeats} / {event.totalSeats} seats</span>
                <span>{Math.round(availablePercentage)}%</span>
              </div>
            </div>

            <div className="event-card-footer">
              <span className="event-card-price">{formatCurrency(event.priceCents, event.currency)}</span>
              <span className="event-card-link" id={`view-event-${event.id}`}>
                View Details →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
