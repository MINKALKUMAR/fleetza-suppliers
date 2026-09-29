import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { TaxiIcon, AlertTriangleIcon, LockIcon, UserIcon } from '../../components/common/Icons';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const isSessionExpired = location.search.includes('session_expired=true');

  const performLogin = async (userToLogin, passToLogin) => {
    setError('');
    setIsSubmitting(true);

    const result = await login({ username: userToLogin.trim(), password: passToLogin });
    setIsSubmitting(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user.fullName || result.user.username}!`, 'success');
      const user = result.user;
      if (user.requiresPasswordChange) {
        navigate('/change-password', { replace: true });
      } else if (user.roles?.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN' || r === 'ADMIN')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.roles?.some((r) => r === 'ROLE_SUPPLIER' || r === 'SUPPLIER')) {
        navigate('/supplier/dashboard', { replace: true });
      } else if (user.roles?.some((r) => r === 'ROLE_DISPATCHER' || r === 'DISPATCHER')) {
        navigate('/admin/requests', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } else {
      setError(result.message || 'Invalid username or password');
      showToast(result.message || 'Login failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }
    await performLogin(username, password);
  };

  const handleQuickDemo = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    performLogin(userVal, passVal);
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <TaxiIcon size={32} color="#f59e0b" />
          <span>FLEETZA</span>
        </div>
        <p className="auth-subtitle">Supplier & Operations Portal</p>
      </div>

      {isSessionExpired && (
        <div className="alert-banner info" style={{ marginBottom: '1rem' }}>
          Your session has expired. Please log in again.
        </div>
      )}

      {error && (
        <div className="alert-banner error" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
          autoComplete="username"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          style={{ height: '44px', fontWeight: 700 }}
        >
          Sign In
        </Button>
      </form>

      {/* Simple 1-Click Quick Demo Logins */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textAlign: 'center', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Instant Demo Logins
        </span>

        <div className="demo-btn-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            className="demo-btn"
            disabled={isSubmitting}
            onClick={() => handleQuickDemo('admin', 'Admin@12345')}
            style={{ padding: '0.5rem', textAlign: 'center' }}
          >
            <strong style={{ display: 'block', fontSize: '0.82rem', color: '#1e40af' }}>👑 Admin</strong>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Operations Access</span>
          </button>

          <button
            type="button"
            className="demo-btn"
            disabled={isSubmitting}
            onClick={() => handleQuickDemo('supplier_demo', 'Supplier@12345')}
            style={{ padding: '0.5rem', textAlign: 'center' }}
          >
            <strong style={{ display: 'block', fontSize: '0.82rem', color: '#047857' }}>🚕 Supplier</strong>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Rajinder · Chandigarh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
