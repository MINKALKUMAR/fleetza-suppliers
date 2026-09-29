import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.65 : 1,
    transition: 'all 0.15s ease-in-out',
    width: fullWidth ? '100%' : 'auto',
    // Mobile ergonomics: minimum touch target of 44px
    minHeight: size === 'lg' ? '48px' : '44px',
    padding: size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
    fontSize: size === 'lg' ? 'var(--font-base)' : 'var(--font-sm)'
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#ffffff',
      borderColor: 'var(--color-primary)'
    },
    secondary: {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      borderColor: '#e2e8f0'
    },
    danger: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      borderColor: '#dc2626'
    },
    success: {
      backgroundColor: '#16a34a',
      color: '#ffffff',
      borderColor: '#16a34a'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-color)'
    }
  };

  const { style: customStyle, ...restProps } = props;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...baseStyles,
        ...(variantStyles[variant] || variantStyles.primary),
        ...(customStyle || {})
      }}
      className={`custom-button ${className}`}
      {...restProps}
    >
      {loading ? (
        <>
          <span style={{
            display: 'inline-block',
            width: '1rem',
            height: '1rem',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite'
          }} />
          <span>Processing...</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
