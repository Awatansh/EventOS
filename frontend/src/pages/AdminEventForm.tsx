import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { PageTransition } from '../components/shared/PageTransition';
import { AnimatedSection } from '../components/shared/AnimatedSection';
import { eventsApi } from '../api/events.api';
import { useEvent } from '../hooks/useEvents';
import { useToast } from '../components/shared/Toast';
import { CATEGORY_META } from '../types';
import type { EventCategory } from '../types';

export const AdminEventForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { addToast } = useToast();

  // If editing, fetch existing event
  const { data: existingEvent, isLoading: loadingEvent } = useEvent(id || '');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    startsAt: '',
    endsAt: '',
    totalSeats: 100,
    priceCents: 0,
    currency: 'INR',
    category: 'conference' as EventCategory,
    imageUrl: '',
    isSeated: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Populate form when editing
  React.useEffect(() => {
    if (existingEvent && !initialized) {
      setFormData({
        name: existingEvent.name || '',
        description: existingEvent.description || '',
        venue: existingEvent.venue || '',
        startsAt: existingEvent.startsAt ? new Date(existingEvent.startsAt).toISOString().slice(0, 16) : '',
        endsAt: existingEvent.endsAt ? new Date(existingEvent.endsAt).toISOString().slice(0, 16) : '',
        totalSeats: existingEvent.totalSeats || 100,
        priceCents: existingEvent.priceCents || 0,
        currency: existingEvent.currency || 'INR',
        category: existingEvent.category || 'conference',
        imageUrl: existingEvent.imageUrl || '',
        isSeated: existingEvent.isSeated !== undefined ? existingEvent.isSeated : true,
      });
      setInitialized(true);
    }
  }, [existingEvent, initialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        venue: formData.venue,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : undefined,
        totalSeats: formData.totalSeats,
        priceCents: formData.priceCents,
        currency: formData.currency,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined,
        isSeated: formData.isSeated,
      };

      if (isEditing && id) {
        await eventsApi.updateEvent(id, payload);
        addToast('success', 'Event updated successfully!');
      } else {
        await eventsApi.createEvent(payload);
        addToast('success', 'Event created successfully!');
      }
      navigate('/admin');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to save event';
      addToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryGradient = CATEGORY_META[formData.category]?.gradient || '';

  if (isEditing && loadingEvent) {
    return (
      <>
        <Navbar />
        <div className="page"><div className="container"><div className="skeleton" style={{ height: '400px' }} /></div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page">
          <div className="container" style={{ maxWidth: '800px' }}>
            <div className="page-header">
              <h1 className="page-title">{isEditing ? 'Edit Event' : 'Create New Event'}</h1>
              <p className="page-subtitle">
                {isEditing ? 'Update event details below' : 'Fill in the details to create a new event'}
              </p>
            </div>

            {/* Live Preview Banner */}
            <AnimatedSection>
              <div
                style={{
                  background: categoryGradient,
                  height: '120px',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 'var(--space-6)',
                  marginBottom: 'var(--space-8)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <span className="category-badge" style={{ marginBottom: 'var(--space-2)', display: 'inline-block' }}>
                    {CATEGORY_META[formData.category]?.emoji} {CATEGORY_META[formData.category]?.label}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    {formData.name || 'Event Name Preview'}
                  </h3>
                </div>
              </div>
            </AnimatedSection>

            {/* Form */}
            <AnimatedSection delay={0.1}>
              <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-8)' }}>
                <div className="admin-form">
                  <div className="input-group full-width">
                    <label className="input-label">Event Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Dev Summit 2026"
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Description</label>
                    <textarea
                      name="description"
                      className="textarea"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell attendees what this event is about..."
                      rows={4}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Category *</label>
                    <select
                      name="category"
                      className="select"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      {Object.entries(CATEGORY_META).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.emoji} {meta.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Venue *</label>
                    <input
                      type="text"
                      name="venue"
                      className="input"
                      value={formData.venue}
                      onChange={handleChange}
                      placeholder="e.g., IIIT Naya Raipur"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="startsAt"
                      className="input"
                      value={formData.startsAt}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">End Date & Time</label>
                    <input
                      type="datetime-local"
                      name="endsAt"
                      className="input"
                      value={formData.endsAt}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Total Seats *</label>
                    <input
                      type="number"
                      name="totalSeats"
                      className="input"
                      value={formData.totalSeats}
                      onChange={handleChange}
                      min={1}
                      max={10000}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Price (in paise) *</label>
                    <input
                      type="number"
                      name="priceCents"
                      className="input"
                      value={formData.priceCents}
                      onChange={handleChange}
                      min={0}
                      placeholder="0 for free events"
                    />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Display: {formData.priceCents === 0 ? 'FREE' : `₹${(formData.priceCents / 100).toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div className="input-group full-width" style={{ marginTop: 'var(--space-2)' }}>
                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="isSeated"
                        checked={formData.isSeated}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
                      />
                      <span>Seated Event (Multiplex-style grid)</span>
                    </label>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', paddingLeft: '26px' }}>
                      If unchecked, the event will be treated as General Admission (quantity-based ticketing).
                    </p>
                  </div>

                  <div className="input-group full-width">
                    <label className="input-label">Image URL (optional)</label>
                    <input
                      type="url"
                      name="imageUrl"
                      className="input"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/event-banner.jpg"
                    />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
                      Note: We do not host images currently. Please upload images to services like Imgur, Postimgs, or Discord and paste the URL here.
                    </span>
                  </div>
                </div>

                <hr className="divider" />

                <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/admin')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                    id="submit-event-btn"
                  >
                    {submitting ? (
                      <><div className="spinner" /> Saving...</>
                    ) : (
                      isEditing ? 'Update Event' : 'Create Event'
                    )}
                  </button>
                </div>
              </form>
            </AnimatedSection>
          </div>
        </div>
      </PageTransition>
    </>
  );
};
