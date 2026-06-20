import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/shared/Toast';
import { AxiosError } from 'axios';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  // Pre-fill from Google OAuth redirect (if present)
  const googleEmail = searchParams.get('googleEmail') || '';
  const googleName = searchParams.get('googleName') || '';
  const isGooglePrefill = Boolean(googleEmail);

  const [form, setForm] = useState({ 
    name: googleName, 
    email: googleEmail, 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
  };

  useEffect(() => {
    const strength = Object.values(passwordChecks).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [form.password]);

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
      const result = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const url = await authApi.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      addToast('error', 'Failed to reach Google Login server');
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

      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ position: 'absolute', top: 'var(--space-8)', left: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span>← Back</span>
      </button>

      <div className="auth-card">
        <Link to="/" className="auth-logo" style={{ textDecoration: 'none' }}>
          Event<span style={{ color: 'var(--color-accent)' }}>OS</span>
        </Link>

        <h1 className="auth-title">
          {isGooglePrefill ? 'Complete your account' : 'Create your account'}
        </h1>
        <p className="auth-subtitle">
          {isGooglePrefill
            ? 'Set a password to finish signing up with Google'
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
              readOnly={isGooglePrefill}
              style={isGooglePrefill ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
            />
            {isGooglePrefill && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                ✓ Verified by Google
              </span>
            )}
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
              <><div className="spinner" /> Creating account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-6) 0' }}>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
          <span style={{ padding: '0 var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>OR</span>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-outline btn-full btn-lg"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 'var(--space-3)' 
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
