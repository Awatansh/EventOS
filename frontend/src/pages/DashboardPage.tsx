import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { useBookings } from '../hooks/useBookings';
import { PageTransition } from '../components/shared/PageTransition';
import { Navbar } from '../components/shared/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useToast } from '../components/shared/Toast';
import { CATEGORY_META, EventCategory } from '../types';

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const CATEGORY_EMOJI: Record<string, string> = {
  conference: '🎤', workshop: '🛠️', hackathon: '⚡', meetup: '🤝', webinar: '🖥️',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(cents: number) {
  if (cents === 0) return 'Free';
  return `₹${(cents / 100).toLocaleString('en-IN')}`;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ limit: 50 });

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      addToast('error', 'Passwords do not match');
      return;
    }
    setIsUpdating(true);
    try {
      await authApi.updateProfile({ name, password: password || undefined });
      addToast('success', 'Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const pastAttendedBookings = useMemo(() => {
    if (!bookingsData?.bookings) return [];
    const now = new Date();
    return bookingsData.bookings.filter(b =>
      b.status === 'confirmed' && new Date(b.event.startsAt) < now
    );
  }, [bookingsData]);

  const totalSpent = useMemo(() => {
    if (!bookingsData?.bookings) return 0;
    return bookingsData.bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalCents, 0);
  }, [bookingsData]);

  const expenditureData = useMemo(() => {
    if (!bookingsData?.bookings) return [];
    const monthlyTotals: Record<string, number> = {};
    bookingsData.bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const date = new Date(b.bookedAt);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + (b.totalCents / 100);
    });
    return Object.entries(monthlyTotals).map(([month, total]) => ({ name: month, total }));
  }, [bookingsData]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    pastAttendedBookings.forEach(b => {
      const cat = CATEGORY_META[b.event.category as EventCategory]?.label || b.event.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [pastAttendedBookings]);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      <Navbar />
      <PageTransition>
        <div className="page">
          <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>

            {/* ── Header ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-5)',
              marginBottom: 'var(--space-8)',
              padding: 'var(--space-6)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: '#fff',
                flexShrink: 0,
                boxShadow: '0 0 0 4px var(--color-accent-light)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '2px' }}>
                  {user?.name}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{user?.email}</p>
              </div>
              {/* Quick Stats */}
              <div className="dashboard-header-stats">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-accent)' }}>
                    {bookingsData?.bookings?.filter(b => b.status === 'confirmed').length ?? '—'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bookings</div>
                </div>
                <div style={{ width: 1, background: 'var(--color-border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#10b981' }}>
                    {pastAttendedBookings.length}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attended</div>
                </div>
                <div style={{ width: 1, background: 'var(--color-border)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#f59e0b' }}>
                    {formatAmount(totalSpent)}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spent</div>
                </div>
              </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="dashboard-grid">

              {/* Left: Charts stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

                {/* Expenditure Bar Chart */}
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    💸 Spending by Month
                  </h3>
                  {expenditureData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={expenditureData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                        <Tooltip
                          cursor={{ fill: 'var(--color-accent-light)' }}
                          contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(v: any) => [`₹${v}`, 'Spent']}
                        />
                        <Bar dataKey="total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                      No spending data yet
                    </div>
                  )}
                </div>

                {/* Category Pie Chart */}
                <div className="card" style={{ padding: 'var(--space-5)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    🎯 Events by Category
                  </h3>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                          {categoryData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                      Attend events to see breakdown
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Profile Settings */}
              <div className="card" style={{ padding: 'var(--space-5)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 'var(--space-5)', fontSize: 'var(--text-base)' }}>
                  ⚙️ Account Settings
                </h3>

                {/* Tab toggle */}
                <div style={{
                  display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)',
                  background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', padding: '3px'
                }}>
                  {(['profile', 'security'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        flex: 1, padding: '6px 0', border: 'none', cursor: 'pointer',
                        borderRadius: 'calc(var(--radius-md) - 2px)', fontSize: 'var(--text-sm)', fontWeight: 500,
                        transition: 'all 0.2s',
                        background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                        color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {tab === 'profile' ? '👤 Profile' : '🔒 Security'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {activeTab === 'profile' && (
                    <div className="input-group">
                      <label className="input-label">Full Name</label>
                      <input
                        type="text"
                        className="input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <>
                      <div className="input-group">
                        <label className="input-label">New Password</label>
                        <input
                          type="password"
                          className="input"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Confirm Password</label>
                        <input
                          type="password"
                          className="input"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          style={{ borderColor: confirmPassword && password !== confirmPassword ? 'var(--color-error)' : '' }}
                        />
                        {confirmPassword && password !== confirmPassword && (
                          <span style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
                            Passwords do not match
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                    style={{ marginTop: 'var(--space-2)', width: '100%' }}
                  >
                    {isUpdating ? 'Saving…' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Event History (Payment App Style) ── */}
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-base)' }}>
                  🎟️ Event History
                </h3>
                {pastAttendedBookings.length > 0 && (
                  <span style={{
                    fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)',
                    background: 'var(--color-accent-light)', padding: '3px 10px', borderRadius: 'var(--radius-full)'
                  }}>
                    {pastAttendedBookings.length} events
                  </span>
                )}
              </div>

              {bookingsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                  <div className="spinner" />
                </div>
              ) : pastAttendedBookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {pastAttendedBookings.map((booking, i) => {
                    const catMeta = CATEGORY_META[booking.event.category as EventCategory];
                    const emoji = CATEGORY_EMOJI[booking.event.category as string] || '🎫';
                    const gradientMap: Record<string, string> = {
                      conference: '#6366F1', workshop: '#14B8A6', hackathon: '#F97316',
                      meetup: '#22C55E', webinar: '#3B82F6',
                    };
                    const color = gradientMap[booking.event.category as string] || '#6366F1';
                    const isLast = i === pastAttendedBookings.length - 1;

                    return (
                      <div key={booking.id} style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                        padding: 'var(--space-4) 0',
                        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                        transition: 'background 0.15s',
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: 44, height: 44, borderRadius: 'var(--radius-md)',
                          background: `${color}18`,
                          border: `1px solid ${color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem', flexShrink: 0,
                        }}>
                          {emoji}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 600, fontSize: 'var(--text-sm)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            marginBottom: '2px',
                          }}>
                            {booking.event.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{
                              fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                            }}>
                              📍 {booking.event.venue}
                            </span>
                          </div>
                        </div>

                        {/* Right side: date + amount */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: 'var(--text-sm)',
                            color: booking.totalCents === 0 ? '#10b981' : 'var(--color-text-primary)',
                            marginBottom: '2px',
                          }}>
                            {formatAmount(booking.totalCents)}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {formatDate(booking.event.startsAt)}
                          </div>
                        </div>

                        {/* Category pill */}
                        <div style={{
                          padding: '3px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                          letterSpacing: '0.05em', flexShrink: 0,
                          background: `${color}18`, color: color,
                          border: `1px solid ${color}30`,
                        }}>
                          {catMeta?.label || booking.event.category}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: 'var(--space-10)',
                  color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎟️</div>
                  <p>No past events yet. Start exploring!</p>
                </div>
              )}
            </div>

            {/* Responsive note: hide stats row on small screens */}
            <style>{`
              @media (max-width: 700px) {
                .db-grid { grid-template-columns: 1fr !important; }
                .db-stats { display: none !important; }
              }
            `}</style>

          </div>
        </div>
      </PageTransition>
    </>
  );
};
