import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth.api';
import { useToast } from '../components/shared/Toast';
import { AxiosError } from 'axios';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isAuthenticated) return <Navigate to="/events" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!form.email) return setErrors({ email: 'Email is required' });
    if (!form.password) return setErrors({ password: 'Password is required' });

    setLoading(true);
    try {
      const result = await authApi.login(form);
      login(result.user, result.accessToken);
      addToast('success', `Welcome back, ${result.user.name}!`);
      navigate('/events');
    } catch (err) {
      const error = err as AxiosError<{ error: { message: string } }>;
      const msg = error.response?.data?.error?.message || 'Login failed. Please try again.';
      addToast('error', msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const result = await authApi.googleLogin(credentialResponse.credential);
      login(result.user, result.accessToken);
      addToast('success', `Welcome back, ${result.user.name}!`);
      navigate('/events');
    } catch (err) {
      const error = err as AxiosError<{ error: { code: string; message: string; details: any } }>;
      const code = error.response?.data?.error?.code;
      
      if (code === 'GOOGLE_ACCOUNT_NOT_REGISTERED') {
        const details = error.response?.data?.error?.details;
        addToast('warning', 'Please complete your registration first.');
        navigate('/register', { 
          state: { 
            googleEmail: details?.email,
            googleName: details?.name,
            googleToken: credentialResponse.credential 
          } 
        });
      } else {
        addToast('error', 'Google Login failed');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card">
        <div className="auth-logo">
          Event<span style={{ color: 'var(--color-accent)' }}>OS</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && <span className="input-helper">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            {errors.password && <span className="input-helper">{errors.password}</span>}
          </div>

          {errors.general && (
            <div className="input-helper" style={{ textAlign: 'center' }}>
              {errors.general}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <><div className="spinner" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-6) 0' }}>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
          <span style={{ padding: '0 var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>OR</span>
          <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => addToast('error', 'Google Login failed')}
            theme="filled_black"
            text="continue_with"
            shape="rectangular"
          />
        </div>

        <div className="auth-footer" style={{ marginTop: 'var(--space-6)' }}>
          Don't have an account?{' '}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};
