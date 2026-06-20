import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/shared/Navbar';
import { PageTransition } from '../components/shared/PageTransition';
import { AnimatedSection } from '../components/shared/AnimatedSection';
import { adminApi } from '../api/admin.api';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import type { AdminStats } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Users, DollarSign, Activity, Plus } from 'lucide-react';

// Mock time-series data for demonstration since the API doesn't return time-series yet
const MOCK_REVENUE_DATA = [
  { name: 'Mon', revenue: 4000 },
  { name: 'Tue', revenue: 3000 },
  { name: 'Wed', revenue: 2000 },
  { name: 'Thu', revenue: 2780 },
  { name: 'Fri', revenue: 1890 },
  { name: 'Sat', revenue: 2390 },
  { name: 'Sun', revenue: 3490 },
];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page">
          <div className="container">
            <div className="page-header">
              <h1 className="page-title">Admin Dashboard</h1>
            </div>
            <div className="admin-stats-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="admin-stat-card"><div className="skeleton" style={{ height: '60px' }} /></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!stats) return null;

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page" style={{ background: 'var(--color-bg)' }}>
          <div className="container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              <div>
                <h1 className="page-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>Admin Dashboard</h1>
                <p className="page-subtitle" style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>Welcome back. Here's what's happening with your platform today.</p>
              </div>
              <Link to="/admin/events/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plus size={18} /> Create Event
              </Link>
            </div>

            {/* Stats Cards */}
            <AnimatedSection>
              <div className="admin-stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                <motion.div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <div style={{ padding: 'var(--space-4)', background: 'var(--color-accent-light)', color: 'var(--color-accent)', borderRadius: 'var(--radius-lg)' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Total Events</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{stats.events.total}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div style={{ padding: 'var(--space-4)', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-lg)' }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Active Bookings</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{stats.bookings.confirmed}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div style={{ padding: 'var(--space-4)', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-lg)' }}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Total Revenue</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{formatCurrency(stats.revenue.totalCents)}</div>
                  </div>
                </motion.div>

                <motion.div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div style={{ padding: 'var(--space-4)', background: 'var(--color-error-light)', color: 'var(--color-error)', borderRadius: 'var(--radius-lg)' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Registered Users</div>
                    <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{stats.users.total}</div>
                  </div>
                </motion.div>
              </div>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
              {/* Chart Section */}
              <AnimatedSection delay={0.2} style={{ flex: 1, minWidth: '400px' }}>
                <div className="card" style={{ padding: 'var(--space-6)', height: '400px', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>Revenue Overview</h2>
                  <div style={{ flex: 1 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          itemStyle={{ color: 'var(--color-text-primary)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </AnimatedSection>

              {/* Recent Bookings Section */}
              <AnimatedSection delay={0.3} style={{ flex: 1, minWidth: '400px' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden', height: '400px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600 }}>
                      Recent Bookings
                    </h2>
                    <Link to="/admin/bookings" style={{ color: 'var(--color-accent)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>View all</Link>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {stats.recentBookings.length === 0 ? (
                      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent bookings.</div>
                    ) : (
                      stats.recentBookings.map((booking, idx) => (
                        <div key={booking.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-6)', borderBottom: idx !== stats.recentBookings.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
                              {booking.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{booking.eventName}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{booking.userName} • {booking.seats.length} {booking.seats.length === 1 ? 'ticket' : 'tickets'}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(booking.totalCents)}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatDate(booking.bookedAt)}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
};
