import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { LockIcon } from '../../components/common/Icons';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleReturnHome = () => {
    if (user?.roles?.includes('ROLE_SUPPLIER')) {
      navigate('/supplier/dashboard');
    } else if (user?.roles?.includes('ROLE_DISPATCHER')) {
      navigate('/admin/requests');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleSwitchToAdmin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dco-container" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dco-empty-state" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem 2rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.5rem'
        }}>
          <LockIcon size={28} color="#ef4444" />
        </div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Admin Panel Restricted
        </h1>
        <p className="dco-empty-desc">
          You are currently logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.fullName || user?.username || 'Supplier'}</strong>. 
          Accessing the Fleetza Operations Admin Panel requires Admin privileges.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" size="md" onClick={handleSwitchToAdmin}>
            👑 Sign In as Admin
          </Button>
          <Button variant="secondary" size="md" onClick={handleReturnHome}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
