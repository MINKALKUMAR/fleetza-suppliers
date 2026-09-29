import React from 'react';

// Maps backend enum keys to user-friendly human labels and clean styling with theme-matching dot indicators
const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    dotColor: '#10b981',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  BOOKED: {
    label: 'Booked',
    dotColor: '#ef4444',
    color: '#991b1b',
    bg: '#fef2f2',
    border: '#fecaca'
  },
  REQUESTED: {
    label: 'Waiting Response',
    dotColor: '#f59e0b',
    color: '#92400e',
    bg: '#fffbeb',
    border: '#fde68a',
    pulse: true
  },
  DECLINED: {
    label: 'Declined',
    dotColor: '#64748b',
    color: '#334155',
    bg: '#f8fafc',
    border: '#cbd5e1'
  },
  CONFIRMED: {
    label: 'Duty Confirmed',
    dotColor: '#2563eb',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe'
  },
  COMPLETED: {
    label: 'Completed',
    dotColor: '#10b981',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  ON_DUTY: {
    label: 'On Duty',
    dotColor: '#2563eb',
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe'
  },
  UNAVAILABLE: {
    label: 'Unavailable',
    dotColor: '#94a3b8',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#e2e8f0'
  },
  MAINTENANCE: {
    label: 'Maintenance',
    dotColor: '#8b5cf6',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe'
  },
  ACTIVE: {
    label: 'Active',
    dotColor: '#10b981',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  INACTIVE: {
    label: 'Disabled',
    dotColor: '#94a3b8',
    color: '#475569',
    bg: '#f1f5f9',
    border: '#e2e8f0'
  },
  BLOCKED: {
    label: 'Blocked',
    dotColor: '#ef4444',
    color: '#991b1b',
    bg: '#fee2e2',
    border: '#fca5a5'
  }
};

const StatusBadge = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status?.toUpperCase()] || {
    label: status || 'Unknown',
    dotColor: '#64748b',
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0'
  };

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.22rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: config.color,
        backgroundColor: config.bg,
        border: `1.5px solid ${config.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          display: 'inline-block',
          boxShadow: config.pulse ? `0 0 0 2px ${config.border}` : 'none'
        }}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
