import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../components/common/Icons';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev.slice(-3), newToast]); // keep at most 3 toasts to avoid clutter

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="fleetza-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`fleetza-toast fleetza-toast-${toast.type}`}>
            <div className="fleetza-toast-icon">
              {toast.type === 'success' && <CheckCircleIcon size={18} color="#10b981" />}
              {toast.type === 'error' && <AlertTriangleIcon size={18} color="#ef4444" />}
              {toast.type === 'info' && <InfoIcon size={18} color="#3b82f6" />}
              {toast.type === 'warning' && <AlertTriangleIcon size={18} color="#f59e0b" />}
            </div>
            <div className="fleetza-toast-content">{toast.message}</div>
            <button
              type="button"
              className="fleetza-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback
    return {
      showToast: (msg) => console.log(msg),
      removeToast: () => {}
    };
  }
  return context;
};
