import React, { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/shared/Toast';
import { AxiosError } from 'axios';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const location = useLocation();
  const googleState = location.state as { googleEmail?: string; googleName?: string; googleToken?: string } | null;
  const isGoogleRegistration = !!googleState?.googleToken;

  const [form, setForm] = useState({ 
    name: googleState?.googleName || '', 
    email: googleState?.googleEmail || '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/events" replace />;

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!form.email) newErrors.email = 'Email is required';
    if (!passwordChecks.length) newErrors.password = 'Password must be at least 8 characters';
    if (!passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.digit) {
      newErrors.password = 'Password must include uppercase, lowercase, and a digit';
    }
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isGoogleRegistration) {
        result = await authApi.googleRegister({
          credential: googleState.googleToken!,
          password: form.password,
        });
      } else {
        result = await authApi.register({
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }
      
      login(result.user, result.accessToken);
      addToast('success', `Welcome to EventOS, ${result.user.name}!`);
      navigate('/events');
    } catch (err) {
      const error = err as AxiosError<{ error: { message: string } }>;
      const msg = error.response?.data?.error?.message || 'Registration failed.';
      addToast('error', msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'var(--color-error)';
    if (passwordStrength <= 2) return 'var(--color-warning)';
    if (passwordStrength <= 3) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card">
        <div className="auth-logo">
          Event<span style={{ color: 'var(--color-accent)' }}>OS</span>
        </div>

        <h1 className="auth-title">
          {isGoogleRegistration ? 'Complete your registration' : 'Create your account'}
        </h1>
        <p className="auth-subtitle">
          {isGoogleRegistration 
            ? 'Set a password to secure your Google account.' 
            : 'Join EventOS to start booking events'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form">
          <div className="input-group">
            <label className="input-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
              disabled={isGoogleRegistration}
            />
            {errors.name && <span className="input-helper">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              disabled={isGoogleRegistration}
            />
            {errors.email && <span className="input-helper">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
            {/* Password strength bar */}
            {form.password && (
              <div style={{ marginTop: '8px' }}>
                <div className="availability-bar">
                  <div
                    className="availability-bar-fill"
                    style={{
                      width: `${(passwordStrength / 4) * 100}%`,
                      background: getStrengthColor(),
                    }}
                  />
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { check: passwordChecks.length, label: '8+ characters' },
                    { check: passwordChecks.uppercase, label: 'Uppercase letter' },
                    { check: passwordChecks.lowercase, label: 'Lowercase letter' },
                    { check: passwordChecks.digit, label: 'Number' },
                  ].map((item) => (
                    <span
                      key={item.label}
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-mono)',
                        color: item.check ? 'var(--color-success)' : 'var(--color-text-muted)',
                      }}
                    >
                      {item.check ? '✓' : '○'} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {errors.password && <span className="input-helper">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="input-helper">{errors.confirmPassword}</span>}
          </div>

          {errors.general && (
            <div className="input-helper" style={{ textAlign: 'center' }}>{errors.general}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="register-submit"
          >
            {loading ? (
              <><div className="spinner" /> {isGoogleRegistration ? 'Completing...' : 'Creating account...'}</>
            ) : (
              isGoogleRegistration ? 'Complete Registration' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
