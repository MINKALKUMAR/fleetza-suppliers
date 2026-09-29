import React, { useState } from 'react';
import { Lock, Shield, X, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const AdminAuthModal = ({
  isOpen,
  title = 'Admin Authorization Required',
  actionDescription = 'Enter your admin password to proceed.',
  confirmLabel = 'Confirm Action',
  onConfirm,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter your admin password.');
      return;
    }

    setIsVerifying(true);
    try {
      const username = user?.username || 'admin';
      // Verify password via auth API
      const res = await authApi.login({
        username,
        password: password.trim()
      });

      if (res.success && res.data) {
        setIsVerifying(false);
        setPassword('');
        setError('');
        onConfirm();
      } else {
        setIsVerifying(false);
        setError('Incorrect admin password. Action blocked.');
      }
    } catch {
      // Local fallback check if offline
      const passClean = password.trim();
      if (passClean === 'Admin@12345' || passClean === 'admin' || passClean === 'admin123' || passClean === 'Admin@123') {
        setIsVerifying(false);
        setPassword('');
        setError('');
        onConfirm();
      } else {
        setIsVerifying(false);
        setError('Incorrect admin password. Action blocked.');
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          animation: 'fleetzaModalPop 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Shield size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                {title}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#bfdbfe' }}>
                Security Protection
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}
          >
            <Lock size={16} color="#1d4ed8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', color: '#1e3a8a' }}>
              <strong>Admin verification needed:</strong>
              <div style={{ marginTop: '0.2rem', color: '#334155' }}>{actionDescription}</div>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <AlertTriangle size={15} color="#dc2626" />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '0.4rem'
              }}
            >
              Admin Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. Admin@12345 or admin)"
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '0.55rem 2.25rem 0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.25rem'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>
              Confirm your identity to authorize this change.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isVerifying}
            >
              {confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthModal;
