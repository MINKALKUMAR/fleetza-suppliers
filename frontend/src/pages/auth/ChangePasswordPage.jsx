import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { LockIcon, KeyIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon, CheckCircleIcon } from '../../components/common/Icons';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changePassword, user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isSupplier = user?.roles?.includes('ROLE_SUPPLIER');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await changePassword({ currentPassword, newPassword });
    setIsSubmitting(false);

    if (result.success) {
      showToast('Password updated successfully!', 'success');
      if (isSupplier) {
        navigate('/supplier/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } else {
      setError(result.message || 'Failed to update password');
      showToast(result.message || 'Failed to update password', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '1rem auto', padding: '0 0.5rem' }}>
      <div
        className="change-password-card"
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              color: 'var(--color-primary, #2563eb)'
            }}
          >
            <LockIcon size={26} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-dark, #0f172a)', margin: 0 }}>
            Account Security
          </h1>
          <p style={{ fontSize: 'var(--font-sm, 0.875rem)', color: 'var(--text-muted, #64748b)', marginTop: '0.35rem' }}>
            Update your login password to secure your Fleetza portal account.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: 'var(--font-sm, 0.875rem)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertTriangleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Current Password */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm, 0.875rem)', fontWeight: 600, color: 'var(--text-primary, #1e293b)', marginBottom: '0.35rem' }}>
              Current Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #64748b)'
                }}
                aria-label="Toggle password visibility"
              >
                {showCurrent ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm, 0.875rem)', fontWeight: 600, color: 'var(--text-primary, #1e293b)', marginBottom: '0.35rem' }}>
              New Password (Min 6 Characters) *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted, #64748b)'
                }}
                aria-label="Toggle password visibility"
              >
                {showNew ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--font-sm, 0.875rem)', fontWeight: 600, color: 'var(--text-primary, #1e293b)', marginBottom: '0.35rem' }}>
              Confirm New Password *
            </label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
            {confirmPassword && newPassword === confirmPassword && (
              <span style={{ fontSize: 'var(--font-xs, 0.75rem)', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.25rem' }}>
                <CheckCircleIcon size={13} /> Passwords match
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                if (user?.requiresPasswordChange) {
                  logout();
                  navigate('/login');
                } else if (isSupplier) {
                  navigate('/supplier/dashboard');
                } else {
                  navigate('/admin/dashboard');
                }
              }}
              style={{ flex: '1 1 120px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
              style={{ flex: '2 1 180px' }}
            >
              <KeyIcon size={16} />
              <span>Save New Password</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
