import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { authApi } from '../../api/auth.api';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    
    logout();
    
    // Force a full browser reload to completely flush React state, React Query cache,
    // and bypass any framer-motion AnimatePresence/ProtectedRoute clash.
    window.location.href = '/';
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar" id="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          Event<span>OS</span>
        </Link>

        <button
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link
              to="/"
              className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/events"
              className={`navbar-link ${isActive('/events') ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              Events
            </Link>
          </li>
          {isAuthenticated && (
            <li>
              <Link
                to="/bookings"
                className={`navbar-link ${isActive('/bookings') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                My Bookings
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          <button 
            onClick={toggleTheme} 
            className="btn btn-ghost" 
            style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-full)' }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {isAuthenticated ? (
            <div className="navbar-user">
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', color: 'inherit' }}>
                <div className="navbar-avatar" id="user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span>{user?.name}</span>
              </Link>
              {isAdmin && <span className="navbar-admin-badge">Admin</span>}
              <button className="btn btn-ghost" onClick={handleLogout} id="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" id="login-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" id="register-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
