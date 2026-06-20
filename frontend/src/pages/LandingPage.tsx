import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Sparkles, MapPin, Zap } from 'lucide-react';
import { Navbar } from '../components/shared/Navbar';
import { EventCard } from '../components/shared/EventCard';
import { AnimatedSection } from '../components/shared/AnimatedSection';
import { PageTransition } from '../components/shared/PageTransition';
import { eventsApi } from '../api/events.api';
import { newsletterApi } from '../api/newsletter.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import type { Event, EventCategory } from '../types';
import { CATEGORY_META } from '../types';

export const LandingPage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('eventos_newsletter_subscribed') === 'true';
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isSubscribed) {
      newsletterApi.getStatus().then((res) => {
        if (res.data.isSubscribed) {
          setIsSubscribed(true);
          localStorage.setItem('eventos_newsletter_subscribed', 'true');
        }
      }).catch(() => { });
    }
  }, [isAuthenticated, isSubscribed]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribing(true);
    try {
      await newsletterApi.subscribe(newsletterEmail);
      setIsSubscribed(true);
      localStorage.setItem('eventos_newsletter_subscribed', 'true');
      addToast('success', 'Successfully subscribed to the newsletter! 🎉');
      setNewsletterEmail('');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to subscribe.';
      if (msg === 'Email is already subscribed') {
        setIsSubscribed(true);
        localStorage.setItem('eventos_newsletter_subscribed', 'true');
        addToast('success', "You're already subscribed! Thanks for sticking around! 🎉");
        setNewsletterEmail('');
      } else {
        addToast('error', msg);
      }
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await eventsApi.getEvents({ limit: 6, status: 'published' });
        setFeaturedEvents(data.events);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories: Array<{ key: EventCategory | 'all'; label: string; emoji: string }> = [
    { key: 'all', label: 'All Events', emoji: '🎯' },
    ...Object.entries(CATEGORY_META).map(([key, meta]) => ({
      key: key as EventCategory,
      label: meta.label,
      emoji: meta.emoji,
    })),
  ];

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Dynamic Hero Section */}
          <section className="hero" id="hero" style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
            {/* Background Shader Effects and SVG */}
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', background: 'var(--color-bg)' }}>
              {/* SVG Grid */}
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-grid)" />
              </svg>

              {/* Dynamic SVGs / Orbs */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw',
                  background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(248,250,252,0) 70%)', borderRadius: '50%', filter: 'blur(60px)'
                }}
              />
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw',
                  background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(248,250,252,0) 70%)', borderRadius: '50%', filter: 'blur(80px)'
                }}
              />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-8)', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <AnimatedSection direction="left">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-6)', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
                    <Sparkles size={16} color="var(--color-accent)" />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Experience the Vibe</span>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={0.1} direction="left">
                  <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.1, marginBottom: 'var(--space-6)' }}>
                    Discover & Book{' '}
                    <span className="gradient-text">Amazing Events</span>
                  </h1>
                </AnimatedSection>

                <AnimatedSection delay={0.2} direction="left">
                  <p className="hero-subtitle" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
                    From tech conferences to developer meetups — find your next event,
                    secure your seat in seconds, and never miss out.
                  </p>
                </AnimatedSection>

                <AnimatedSection delay={0.3} direction="left">
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
                    <Link to="/events" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4) var(--space-8)', fontSize: 'var(--text-lg)' }}>
                      <Search size={20} /> Browse Events
                    </Link>
                    <Link to="/register" className="btn btn-secondary btn-lg" style={{ padding: 'var(--space-4) var(--space-8)', fontSize: 'var(--text-lg)', background: 'var(--color-surface)', boxShadow: '0 4px 12px rgba(15,23,42,0.05)' }}>
                      Create Account
                    </Link>
                  </div>
                </AnimatedSection>
              </div>

              {/* Responsive SVG Illustration generated to replace StitchMCP Image */}
              <AnimatedSection delay={0.2} direction="right" className="hero-image-wrapper">
                <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
                  <svg
                    viewBox="0 0 500 500"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
                  >
                    {/* Main floating card */}
                    <motion.g
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <rect x="100" y="80" width="300" height="340" rx="24" fill="var(--color-surface)" filter="drop-shadow(0px 20px 40px rgba(99, 102, 241, 0.15))" />
                      <rect x="120" y="100" width="260" height="160" rx="16" fill="url(#heroGrad)" />
                      {/* Ticket graphics inside card */}
                      <circle cx="160" cy="140" r="16" fill="var(--color-surface)" fillOpacity="0.2" />
                      <circle cx="160" cy="140" r="8" fill="var(--color-surface)" />
                      <path d="M 200 135 L 300 135 M 200 150 L 260 150" stroke="var(--color-surface)" strokeWidth="4" strokeLinecap="round" />

                      {/* Content lines */}
                      <rect x="130" y="290" width="180" height="16" rx="8" fill="var(--color-border)" />
                      <rect x="130" y="320" width="120" height="12" rx="6" fill="var(--color-border)" />
                      <rect x="130" y="360" width="80" height="24" rx="12" fill="var(--color-accent)" />
                    </motion.g>

                    {/* Secondary floating element (Calendar) */}
                    <motion.g
                      animate={{ y: [5, -5, 5], rotate: [-2, 2, -2] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    >
                      <rect x="50" y="240" width="140" height="140" rx="20" fill="var(--color-surface)" filter="drop-shadow(0px 10px 30px rgba(16, 185, 129, 0.15))" />
                      <rect x="50" y="240" width="140" height="40" rx="20" fill="var(--color-success)" />
                      <rect x="50" y="260" width="140" height="20" fill="var(--color-success)" />
                      <circle cx="90" cy="310" r="12" fill="var(--color-border)" />
                      <circle cx="130" cy="310" r="12" fill="var(--color-success)" />
                      <circle cx="90" cy="340" r="12" fill="var(--color-border)" />
                      <circle cx="130" cy="340" r="12" fill="var(--color-border)" />
                    </motion.g>

                    {/* Third floating element (Avatar / Ticket) */}
                    <motion.g
                      animate={{ y: [-5, 5, -5], rotate: [2, -2, 2] }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    >
                      <rect x="320" y="150" width="120" height="120" rx="60" fill="var(--color-surface)" filter="drop-shadow(0px 15px 30px rgba(244, 63, 94, 0.15))" />
                      <circle cx="380" cy="210" r="40" fill="url(#avatarGrad)" />
                      <path d="M 370 200 L 395 210 L 370 220 Z" fill="var(--color-surface)" />
                    </motion.g>

                    <defs>
                      <linearGradient id="heroGrad" x1="120" y1="100" x2="380" y2="260" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1" />
                        <stop offset="1" stopColor="#A855F7" />
                      </linearGradient>
                      <linearGradient id="avatarGrad" x1="340" y1="170" x2="420" y2="250" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F43F5E" />
                        <stop offset="1" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Quick Features */}
          <section className="container" style={{ paddingBottom: 'var(--space-12)' }}>
            <div className="grid grid-cols-3" style={{ gap: 'var(--space-6)' }}>
              {[
                { icon: <Zap color="#F59E0B" size={24} />, title: "Instant Booking", desc: "No queues. Book your spot in 2 clicks." },
                { icon: <MapPin color="#6366F1" size={24} />, title: "Prime Venues", desc: "Access to the most exclusive locations." },
                { icon: <Calendar color="#10B981" size={24} />, title: "Smart Reminders", desc: "We'll ping you before it starts." }
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="card"
                  style={{ textAlign: 'center', padding: 'var(--space-8)' }}
                >
                  <div style={{ display: 'inline-flex', padding: 'var(--space-4)', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)' }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{f.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Category Scroller */}
          <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-8) 0' }}>
            <div className="container">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-6)', textAlign: 'center' }}>Explore by Vibe</h2>
              <div className="category-chips" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={cat.key === 'all' ? '/events' : `/events?category=${cat.key}`} className="category-chip" style={{ padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--text-md)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                      {cat.emoji} {cat.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Staggered Event Grid (StitchMCP style) */}
          <section className="container" id="featured-events" style={{ paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-16)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-10)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.1 }}>
                  Upcoming <span style={{ color: 'var(--color-accent)' }}>Experiences</span>
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>
                  The most anticipated events, handpicked for you.
                </p>
              </div>
              <Link to="/events" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                View all experiences →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="card skeleton-card" style={{ height: '350px' }} />
                ))}
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="grid grid-cols-3" style={{ gap: 'var(--space-8)' }}>
                {featuredEvents.slice(0, 6).map((event, i) => (
                  <EventCard key={event.id} event={event} index={i} />
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ background: 'var(--color-surface)', padding: 'var(--space-12)', borderRadius: 'var(--radius-xl)' }}>
                <Sparkles size={48} color="var(--color-text-muted)" style={{ marginBottom: 'var(--space-4)' }} />
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>No experiences scheduled yet.</p>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>Check back soon for the hottest drops.</p>
              </div>
            )}
          </section>

          {/* Newsletter Section */}
          <section style={{ background: 'var(--color-accent)', padding: 'var(--space-16) 0', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '600px' }}>
              <AnimatePresence mode="wait">
                {!isSubscribed ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Stay in the Loop</h2>
                    <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-8)', opacity: 0.9 }}>
                      Subscribe to our newsletter to get early access to exclusive events, workshops, and meetups.
                    </p>
                    <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: '400px', margin: '0 auto' }}>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        style={{ flex: 1, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', outline: 'none', color: 'var(--color-text-primary)' }}
                        required
                      />
                      <button type="submit" disabled={subscribing} style={{ whiteSpace: 'nowrap', border: 'none', color: 'var(--color-accent)', background: 'white', padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
                        {subscribing ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ padding: 'var(--space-4) 0' }}
                  >
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🎉 Thanks for subscribing!</h2>
                    <p style={{ fontSize: 'var(--text-lg)', opacity: 0.9 }}>
                      You'll be the first to know about new events and exclusive drops.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer" id="footer" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', marginTop: 'auto' }}>
            <div className="container footer-inner" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'calc(var(--space-8) + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>
                  Event<span style={{ color: 'var(--color-accent)' }}>OS</span>
                </span>
                <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                  © {new Date().getFullYear()} X2.0 Dev Agency. All rights reserved.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
                <a href="#" className="hover:text-accent">Terms</a>
                <a href="#" className="hover:text-accent">Privacy</a>
                <a href="#" className="hover:text-accent">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </PageTransition>
    </>
  );
};
