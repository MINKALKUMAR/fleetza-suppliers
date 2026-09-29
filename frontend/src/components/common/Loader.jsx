import React from 'react';

const Loader = ({ size = 'md', message = 'Loading...' }) => {
  const dimensions = size === 'lg' ? '48px' : size === 'sm' ? '20px' : '32px';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '1rem'
    }}>
      <div style={{
        width: dimensions,
        height: dimensions,
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      {message && (
        <p style={{
          fontSize: 'var(--font-sm)',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
