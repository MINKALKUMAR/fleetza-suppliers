import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  helperText = '',
  className = '',
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {typeof label === 'string' ? label.replace(/\s*\*+$/, '') : label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`form-input ${error ? 'error' : ''}`}
        {...props}
      />
      {error && <span className="form-error-text">{error}</span>}
      {helperText && !error && (
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
