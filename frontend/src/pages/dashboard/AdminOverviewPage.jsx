import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import AdminAuthModal from '../../components/common/AdminAuthModal';
import {
  TaxiIcon,
  CarIcon,
  CheckCircleIcon,
  SirenIcon,
  ZapIcon,
  UsersIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  WhatsAppIcon,
  RefreshIcon,
  PlusIcon,
  TrashIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
  XIcon,
  CopyIcon,
  PhoneIcon,
  AlertTriangleIcon
} from '../../components/common/Icons';

const AdminOverviewPage = () => {
  const {
    user,
    suppliers,
    vehicles,
    bookingRequests: requests,
    cities,
    vehicleGroups,
    addCity,
    deleteCity,
    addVehicleGroup,
    deleteVehicleGroup,
    toggleSupplierOnline,
    refreshAllData
  } = useAuth();

  const { showToast } = useToast();

  const [newCityName, setNewCityName] = useState('');
  const [citySubmitting, setCitySubmitting] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [supplierSearch, setSupplierSearch] = useState('');

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: '',
    actionDescription: '',
    confirmLabel: 'Confirm',
    onConfirm: null
  });

  // Helper to parse supplier login info
  const getSupplierLoginDetails = (supplier) => {
    const isOnline = !!supplier.isOnline;
    const lastLogin = supplier.lastLoginAt ? new Date(supplier.lastLoginAt) : null;
    let daysInactive = supplier.daysSinceLastLogin != null ? supplier.daysSinceLastLogin : null;

    if (daysInactive == null && lastLogin) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
      daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    let timeText = 'Never logged in';
    if (lastLogin) {
      const isToday = new Date().toDateString() === lastLogin.toDateString();
      const timeStr = lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        timeText = `Today at ${timeStr}`;
      } else {
        timeText = `${lastLogin.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
      }
    }

    return {
      isOnline,
      lastLogin,
      timeText,
      daysInactive: daysInactive ?? 999
    };
  };

  const makeReminderText = (supplier) => {
    const portalUrl = window.location.origin + '/login';
    return `Hello ${supplier.fullName || 'Partner'}, please log in to your Fleetza Supplier Portal (${portalUrl}) to view active duty dispatches. - Fleetza Operations`;
  };

  const handleCopyReminder = (supplier) => {
    const msg = makeReminderText(supplier);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(msg);
      showToast(`"Please login" reminder message copied for ${supplier.fullName || supplier.username}!`, 'success', 3500);
    } else {
      showToast('Clipboard not accessible', 'error');
    }
  };

  const onlineSuppliersCount = suppliers.filter((s) => !!s.isOnline).length;
  const offlineSuppliersCount = suppliers.length - onlineSuppliersCount;
  const todayLoginCount = suppliers.filter((s) => {
    if (!s.lastLoginAt) return false;
    return new Date().toDateString() === new Date(s.lastLoginAt).toDateString();
  }).length;
  const inactiveSuppliersCount = suppliers.filter((s) => {
    if (!s.lastLoginAt) return true;
    const days = s.daysSinceLastLogin != null ? s.daysSinceLastLogin : 0;
    return days >= 2;
  }).length;

  const filteredSuppliersForMonitor = suppliers.filter((s) => {
    const q = supplierSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      `${s.fullName || ''} ${s.companyName || ''} ${s.username || ''} ${s.city || ''} ${s.whatsapp || ''}`
        .toLowerCase()
        .includes(q);
    if (!matchesQuery) return false;

    if (supplierFilter === 'ONLINE') return !!s.isOnline;
    if (supplierFilter === 'OFFLINE') return !s.isOnline;
    if (supplierFilter === 'TODAY') {
      if (!s.lastLoginAt) return false;
      return new Date().toDateString() === new Date(s.lastLoginAt).toDateString();
    }
    if (supplierFilter === 'INACTIVE') {
      if (!s.lastLoginAt) return true;
      const days = s.daysSinceLastLogin != null ? s.daysSinceLastLogin : 0;
      return days >= 2;
    }
    return true;
  });

  const liveRequests = requests.filter(
    (request) => request.status === 'REQUESTED' || request.status === 'CONFIRMED'
  );
  const available = vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length;
  const pending = requests.filter((request) => request.status === 'REQUESTED').length;
  const confirmed = requests.filter((request) => request.status === 'CONFIRMED').length;

  // Compute coverage stats per city
  const cityRows = cities.map((cityObj) => {
    const cityName = typeof cityObj === 'string' ? cityObj : cityObj.name;
    const cityId = typeof cityObj === 'object' ? cityObj.id : null;
    const citySuppliers = suppliers.filter(
      (s) => (s.city || '').toLowerCase() === cityName.toLowerCase()
    );
    const cityVehicles = vehicles.filter((v) =>
      citySuppliers.some((s) => String(s.id) === String(v.supplierId))
    );
    const availableInCity = cityVehicles.filter((v) => v.status === 'AVAILABLE').length;

    return {
      id: cityId,
      name: cityName,
      suppliersCount: citySuppliers.length,
      vehiclesCount: cityVehicles.length,
      availableCount: availableInCity
    };
  });

  // Compute stats per vehicle group with robust model and name matching
  const groupRows = vehicleGroups.map((groupObj) => {
    const groupName = typeof groupObj === 'string' ? groupObj : groupObj.name;
    const groupId = typeof groupObj === 'object' ? groupObj.id : null;
    const gLower = (groupName || '').toLowerCase().trim();

    const matchingVehicles = vehicles.filter((v) => {
      const vName = (v.name || '').toLowerCase();
      const vModel = (v.model || '').toLowerCase();
      const vGroup = (v.vehicleGroup || '').toLowerCase();
      const vCat = (v.category || '').toLowerCase();

      return (
        vGroup === gLower ||
        vName === gLower ||
        vModel === gLower ||
        vName.includes(gLower) ||
        vModel.includes(gLower) ||
        (gLower === 'sedan ac' && (vCat.includes('sedan') || vName.includes('dzire') || vModel.includes('dzire'))) ||
        (gLower === 'suv' && (vCat.includes('suv') || vName.includes('innova') || vName.includes('ertiga') || vName.includes('hycross') || vName.includes('crysta') || vName.includes('rumion')))
      );
    });

    const readyCount = matchingVehicles.filter((v) => v.status === 'AVAILABLE').length;

    return {
      id: groupId,
      name: groupName,
      totalCount: matchingVehicles.length,
      readyCount
    };
  });

  // Compute supplier-wise vehicle readiness (Booked vs Available Live)
  const supplierFleetRows = useMemo(() => {
    return suppliers.map((supplier) => {
      const suppVehicles = vehicles.filter((v) => String(v.supplierId) === String(supplier.id));
      const totalCount = suppVehicles.length;
      const readyCount = suppVehicles.filter((v) => v.status === 'AVAILABLE').length;
      const bookedCount = suppVehicles.filter((v) => v.status !== 'AVAILABLE').length;
      return {
        supplier,
        totalCount,
        readyCount,
        bookedCount,
        isOnline: !!supplier.isOnline
      };
    });
  }, [suppliers, vehicles]);

  const handleAddCity = (e) => {
    e.preventDefault();
    const trimmed = newCityName.trim();
    if (!trimmed) return;

    setAuthModal({
      isOpen: true,
      title: 'Authorize Add City',
      actionDescription: `Enter admin password to add "${trimmed}" to operational cities.`,
      confirmLabel: 'Add City',
      onConfirm: async () => {
        setAuthModal((prev) => ({ ...prev, isOpen: false }));
        setCitySubmitting(true);
        const res = await addCity(trimmed);
        setCitySubmitting(false);

        if (res.success) {
          setNewCityName('');
          showToast(`City "${trimmed}" added successfully.`, 'success');
        } else {
          showToast(res.message || 'Failed to add city', 'error');
        }
      }
    });
  };

  const handleDeleteCity = (cityItem) => {
    setAuthModal({
      isOpen: true,
      title: 'Authorize Remove City',
      actionDescription: `Enter admin password to remove operational city "${cityItem.name}".`,
      confirmLabel: 'Remove City',
      onConfirm: async () => {
        setAuthModal((prev) => ({ ...prev, isOpen: false }));
        const res = await deleteCity(cityItem.id ? cityItem : cityItem.name);
        if (res.success) {
          showToast(`City "${cityItem.name}" removed from coverage.`, 'info');
        } else {
          showToast(res.message || 'Failed to delete city', 'error');
        }
      }
    });
  };

  const handleAddGroup = (e) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;

    setAuthModal({
      isOpen: true,
      title: 'Authorize Add Vehicle Group',
      actionDescription: `Enter admin password to add vehicle group "${trimmed}".`,
      confirmLabel: 'Add Vehicle Group',
      onConfirm: async () => {
        setAuthModal((prev) => ({ ...prev, isOpen: false }));
        setGroupSubmitting(true);
        const res = await addVehicleGroup(trimmed);
        setGroupSubmitting(false);

        if (res.success) {
          setNewGroupName('');
          showToast(`Vehicle group "${trimmed}" added successfully.`, 'success');
        } else {
          showToast(res.message || 'Failed to add vehicle group', 'error');
        }
      }
    });
  };

  const handleDeleteGroup = (groupItem) => {
    setAuthModal({
      isOpen: true,
      title: 'Authorize Remove Vehicle Group',
      actionDescription: `Enter admin password to remove vehicle group "${groupItem.name}".`,
      confirmLabel: 'Remove Vehicle Group',
      onConfirm: async () => {
        setAuthModal((prev) => ({ ...prev, isOpen: false }));
        const res = await deleteVehicleGroup(groupItem.id ? groupItem : groupItem.name);
        if (res.success) {
          showToast(`Vehicle group "${groupItem.name}" removed.`, 'info');
        } else {
          showToast(res.message || 'Failed to delete vehicle group', 'error');
        }
      }
    });
  };

  return (
    <div className="admin-container">
      {/* 1. Header Command Bar */}
      <div className="admin-hero-card">
        <div className="admin-hero-copy">
          <div className="admin-live-badge">
            <span className="admin-pulse-dot" />
            <span>OPERATIONS COMMAND</span>
          </div>
          <h1>Operations Desk</h1>
          <p>Live fleet readiness, regional network, and active booking dispatches.</p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-hero-btn secondary"
            onClick={() => {
              refreshAllData();
              showToast('Data refreshed live.', 'info');
            }}
            title="Refresh latest data"
          >
            <RefreshIcon size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/requests" className="admin-hero-btn primary">
            <ZapIcon size={16} />
            <span>Dispatch Duty</span>
          </Link>
          <Link to="/admin/suppliers" className="admin-hero-btn secondary">
            <UsersIcon size={16} />
            <span>Suppliers</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Operational Metrics */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card accent-green">
          <div className="admin-metric-top">
            <span>Ready Cars</span>
            <div className="admin-metric-icon">
              <CheckCircleIcon size={22} color="#10b981" />
            </div>
          </div>
          <div className="admin-metric-value">{available}</div>
          <div className="admin-metric-footer">
            <span>of <strong>{vehicles.length}</strong> total fleet</span>
          </div>
        </div>

        <div className="admin-metric-card accent-amber">
          <div className="admin-metric-top">
            <span>Pending Dispatches</span>
            <div className="admin-metric-icon">
              <SirenIcon size={22} color="#f59e0b" />
            </div>
          </div>
          <div className="admin-metric-value">{pending}</div>
          <div className="admin-metric-footer">
            <span>waiting supplier acceptance</span>
          </div>
        </div>

        <div className="admin-metric-card accent-blue">
          <div className="admin-metric-top">
            <span>Confirmed Duties</span>
            <div className="admin-metric-icon">
              <ZapIcon size={22} color="#3b82f6" />
            </div>
          </div>
          <div className="admin-metric-value">{confirmed}</div>
          <div className="admin-metric-footer">
            <span>active dispatches assigned</span>
          </div>
        </div>

        <div className="admin-metric-card accent-purple">
          <div className="admin-metric-top">
            <span>Supplier Partners</span>
            <div className="admin-metric-icon">
              <UsersIcon size={22} color="#8b5cf6" />
            </div>
          </div>
          <div className="admin-metric-value">{suppliers.length}</div>
          <div className="admin-metric-footer">
            <span>across <strong>{cities.length}</strong> cities</span>
          </div>
        </div>
      </div>

      {/* 3. Live Supplier Login & Activity Monitor (Compact & High Density) */}
      <section className="admin-step-panel">
        <div className="admin-step-header" style={{ marginBottom: '0.65rem' }}>
          <div className="admin-step-number" style={{ background: '#ecfdf5', color: '#059669', width: 28, height: 28 }}>
            <UsersIcon size={15} color="#059669" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 className="admin-step-title" style={{ fontSize: '0.95rem', margin: 0 }}>
                Supplier Activity Monitor ({suppliers.length} Partners)
              </h2>
            </div>

            {/* Quick Search */}
            <div style={{ minWidth: '170px', maxWidth: '240px' }}>
              <input
                type="text"
                className="form-input"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Search partner, city..."
                style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              />
            </div>
          </div>
        </div>

        {/* Compact Filter Bar */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
          <button
            type="button"
            className={`filter-chip ${supplierFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setSupplierFilter('ALL')}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >
            All ({suppliers.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${supplierFilter === 'ONLINE' ? 'active' : ''}`}
            onClick={() => setSupplierFilter('ONLINE')}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: supplierFilter === 'ONLINE' ? '#ffffff' : '#15803d' }}
          >
            <span className="supplier-online-dot online" style={{ width: 6, height: 6 }} />
            <span>Online ({onlineSuppliersCount})</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${supplierFilter === 'TODAY' ? 'active' : ''}`}
            onClick={() => setSupplierFilter('TODAY')}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >
            Today ({todayLoginCount})
          </button>
          <button
            type="button"
            className={`filter-chip ${supplierFilter === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setSupplierFilter('INACTIVE')}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: supplierFilter === 'INACTIVE' ? '#ffffff' : '#b91c1c' }}
          >
            <AlertTriangleIcon size={11} />
            <span>Inactive &gt;2d ({inactiveSuppliersCount})</span>
          </button>
          <button
            type="button"
            className={`filter-chip ${supplierFilter === 'OFFLINE' ? 'active' : ''}`}
            onClick={() => setSupplierFilter('OFFLINE')}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >
            Offline ({offlineSuppliersCount})
          </button>
        </div>

        {/* Compact Supplier Activity Rows */}
        {filteredSuppliersForMonitor.length === 0 ? (
          <div className="empty-state" style={{ padding: '0.75rem 0', fontSize: '0.78rem' }}>
            No partners match selected filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {filteredSuppliersForMonitor.map((supplier) => {
              const { isOnline, timeText, daysInactive } = getSupplierLoginDetails(supplier);
              const isInactive = !supplier.lastLoginAt || daysInactive >= 2;
              const reminderMsg = makeReminderText(supplier);
              const phone = supplier.whatsapp || supplier.mobile;

              return (
                <div
                  key={supplier.id}
                  className="supplier-monitor-row"
                  style={{
                    border: '1px solid ' + (isOnline ? '#bbf7d0' : isInactive ? '#fecaca' : '#e2e8f0')
                  }}
                >
                  {/* Partner Details */}
                  <div className="supplier-monitor-info">
                    <span
                      className={`supplier-online-dot ${isOnline ? 'online' : 'offline'}`}
                      style={{ width: 8, height: 8, flexShrink: 0 }}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {supplier.fullName || supplier.username}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      ({supplier.companyName || 'Operator'} • <MapPinIcon size={10} style={{ display: 'inline' }} /> {supplier.city || 'Punjab'})
                    </span>

                    {/* Online status toggle */}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await toggleSupplierOnline(supplier.id);
                        if (res.success) {
                          showToast(`${supplier.fullName} status updated live.`, 'info');
                        }
                      }}
                      className={`supplier-online-badge ${isOnline ? 'online' : 'offline'}`}
                      style={{ border: 'none', cursor: 'pointer', padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}
                      title="Click to toggle status"
                    >
                      {isOnline ? '● Online' : '○ Offline'}
                    </button>

                    {isInactive && (
                      <span className="supplier-inactive-tag" style={{ fontSize: '0.65rem', padding: '0.05rem 0.3rem' }}>
                        {daysInactive >= 999 ? 'Never In' : `${daysInactive}d Inactive`}
                      </span>
                    )}

                    <span className="supplier-monitor-time" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Last: <strong>{timeText}</strong>
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="supplier-monitor-actions">
                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(reminderMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-reminder-wa"
                        style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', borderRadius: 4 }}
                        title="Send WhatsApp 'Please Login' Reminder"
                      >
                        <WhatsAppIcon size={12} color="#ffffff" />
                        <span>WhatsApp Reminder</span>
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-reminder-copy"
                      style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', borderRadius: 4 }}
                      onClick={() => handleCopyReminder(supplier)}
                      title="Copy reminder message"
                    >
                      <CopyIcon size={11} />
                    </button>
                    <Link
                      to="/admin/suppliers"
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-primary)',
                        padding: '0.2rem 0.45rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      Manage ↗
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3b. Dedicated Supplier Fleet Readiness Tracker (Supplier-Wise Booked & Available Live) */}
      <section className="admin-step-panel">
        <div className="admin-step-header">
          <div className="admin-step-number" style={{ background: '#ecfdf5', color: '#047857' }}>
            <TaxiIcon size={18} color="#047857" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 className="admin-step-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Supplier Fleet Status Live</span>
                <span className="admin-live-badge" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                  <span className="admin-pulse-dot" /> LIVE TRACKER
                </span>
              </h2>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: 0 }}>
                Supplier-wise vehicle breakdown: track available and booked commercial cars in real-time.
              </p>
            </div>
            <Link to="/admin/fleet" style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <span>View All Fleet ({vehicles.length})</span>
              <ExternalLinkIcon size={12} />
            </Link>
          </div>
        </div>

        {supplierFleetRows.length === 0 ? (
          <p className="empty-state">No suppliers registered yet.</p>
        ) : (
          <div className="supplier-fleet-grid">
            {supplierFleetRows.map(({ supplier, totalCount, readyCount, bookedCount, isOnline }) => {
              const phone = supplier.whatsapp || supplier.mobile;
              return (
                <div key={supplier.id} className="supplier-fleet-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isOnline ? '#10b981' : '#64748b',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}
                      >
                        {(supplier.fullName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--color-dark)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {supplier.fullName}
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {supplier.companyName || 'Operator'} • <MapPinIcon size={10} style={{ display: 'inline' }} /> {supplier.city || 'Punjab'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const res = await toggleSupplierOnline(supplier.id);
                        if (res.success) {
                          showToast(`${supplier.fullName} online status toggled!`, 'info');
                        }
                      }}
                      title="Click to toggle online/offline status live"
                      style={{
                        border: 'none',
                        background: isOnline ? '#dcfce7' : '#f1f5f9',
                        color: isOnline ? '#15803d' : '#475569',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <span className={`supplier-online-dot ${isOnline ? 'online' : 'offline'}`} style={{ width: 6, height: 6 }} />
                      <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </button>
                  </div>

                  {/* 3-column stats: Total Cars | Available | Booked */}
                  <div className="supplier-fleet-stats-row">
                    <div className="supplier-fleet-stat-badge ready">
                      <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Available</span>
                      <strong style={{ fontSize: '0.95rem', fontWeight: 800 }}>{readyCount}</strong>
                    </div>
                    <div className="supplier-fleet-stat-badge booked">
                      <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Booked / Busy</span>
                      <strong style={{ fontSize: '0.95rem', fontWeight: 800 }}>{bookedCount}</strong>
                    </div>
                    <div className="supplier-fleet-stat-badge total">
                      <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>Total Fleet</span>
                      <strong style={{ fontSize: '0.95rem', fontWeight: 800 }}>{totalCount}</strong>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
                    {phone && (
                      <a
                        href={`https://wa.me/${phone.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        style={{
                          background: '#25d366',
                          color: '#ffffff',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <WhatsAppIcon size={12} color="#ffffff" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <Link
                      to="/admin/suppliers"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <span>Manage Cars ({totalCount})</span>
                      <ExternalLinkIcon size={11} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Operational Cities Master (Compact & Password-Protected) */}
      <section className="admin-step-panel">
        <div className="admin-step-header" style={{ marginBottom: '0.65rem' }}>
          <div className="admin-step-number" style={{ width: 28, height: 28 }}>
            <MapPinIcon size={15} color="var(--color-primary)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.4rem' }}>
            <h2 className="admin-step-title" style={{ fontSize: '0.95rem', margin: 0 }}>
              Operational Cities ({cities.length})
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              🔒 Password required to add or delete cities
            </span>
          </div>
        </div>

        {/* Compact Add City Bar */}
        <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem', maxWidth: '480px' }}>
          <input
            type="text"
            className="form-input"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            placeholder="Type city name (e.g. Shimla, Dehradun)..."
            required
            style={{ flex: 1, height: '32px', fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
          />
          <button
            type="submit"
            className="admin-hero-btn primary"
            disabled={citySubmitting || !newCityName.trim()}
            style={{ whiteSpace: 'nowrap', height: '32px', padding: '0.2rem 0.65rem', fontSize: '0.75rem' }}
          >
            <PlusIcon size={13} />
            <span>Add City</span>
          </button>
        </form>

        {/* Compact City Chips Grid */}
        {cityRows.length === 0 ? (
          <p className="empty-state" style={{ padding: '0.75rem 0', fontSize: '0.78rem' }}>No cities configured.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.45rem' }}>
            {cityRows.map((row) => (
              <div
                key={row.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.65rem',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.78rem'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <MapPinIcon size={12} color="var(--color-primary)" />
                    <span>{row.name}</span>
                  </strong>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>
                    <span style={{ color: row.availableCount > 0 ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                      {row.availableCount} ready
                    </span>
                    <span> • {row.vehiclesCount} cars • {row.suppliersCount} supp</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Link
                    to="/admin/requests"
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      background: '#eff6ff',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      textDecoration: 'none'
                    }}
                    title={`Dispatch duty in ${row.name}`}
                  >
                    Dispatch
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteCity(row)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                    title={`Remove ${row.name} (Requires Admin Password)`}
                  >
                    <TrashIcon size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Vehicle Groups Master (Compact & Password-Protected) */}
      <section className="admin-step-panel">
        <div className="admin-step-header" style={{ marginBottom: '0.65rem' }}>
          <div className="admin-step-number" style={{ background: '#fef3c7', color: '#b45309', width: 28, height: 28 }}>
            <TaxiIcon size={15} color="#b45309" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.4rem' }}>
            <h2 className="admin-step-title" style={{ fontSize: '0.95rem', margin: 0 }}>
              Vehicle Groups & Categories ({vehicleGroups.length})
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              🔒 Password required to add or delete categories
            </span>
          </div>
        </div>

        {/* Compact Add Group Form */}
        <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.65rem', maxWidth: '480px' }}>
          <input
            type="text"
            className="form-input"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Type vehicle group name (e.g. Fortuner, Tempo)..."
            required
            style={{ flex: 1, height: '32px', fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
          />
          <button
            type="submit"
            className="admin-hero-btn primary"
            disabled={groupSubmitting || !newGroupName.trim()}
            style={{ whiteSpace: 'nowrap', height: '32px', padding: '0.2rem 0.65rem', fontSize: '0.75rem' }}
          >
            <PlusIcon size={13} />
            <span>Add Group</span>
          </button>
        </form>

        {/* Compact Vehicle Groups Chips Grid */}
        {groupRows.length === 0 ? (
          <p className="empty-state" style={{ padding: '0.75rem 0', fontSize: '0.78rem' }}>No vehicle groups configured.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.45rem' }}>
            {groupRows.map((grp) => (
              <div
                key={grp.name}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '0.4rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TaxiIcon size={13} color="#f59e0b" />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--color-dark)' }}>{grp.name}</strong>
                    <div style={{ fontSize: '0.68rem', color: grp.readyCount > 0 ? '#15803d' : '#64748b', fontWeight: 600 }}>
                      {grp.totalCount} cars ({grp.readyCount} ready)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                  onClick={() => handleDeleteGroup(grp)}
                  title={`Delete group ${grp.name} (Requires Admin Password)`}
                  aria-label={`Delete group ${grp.name}`}
                >
                  <TrashIcon size={12} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Live Booking Requests Queue */}
      <section className="admin-step-panel">
        <div className="admin-step-header">
          <div className="admin-step-number">
            <ZapIcon size={18} color="#f59e0b" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2 className="admin-step-title">Live Dispatch Queue & Status</h2>
            <Link
              to="/admin/requests"
              style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--color-primary)' }}
            >
              View All Requests →
            </Link>
          </div>
        </div>

        {liveRequests.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem 0' }}>
            No live booking requests waiting right now. Use the Dispatch button to send a duty to a supplier.
          </div>
        ) : (
          <div className="admin-ops-tracker-list">
            {liveRequests.slice(-6).reverse().map((request) => {
              const vehicle = vehicles.find((item) => String(item.id) === String(request.vehicleId));
              const supplier = suppliers.find((item) => String(item.id) === String(request.supplierId));
              const isConfirmed = request.status === 'CONFIRMED';
              const isRequested = request.status === 'REQUESTED';

              return (
                <div
                  className={`admin-tracker-row ${isConfirmed ? 'confirmed' : isRequested ? 'requested' : ''}`}
                  key={request.id}
                >
                  <div className="admin-tracker-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="plate-badge" style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }}>
                        <TaxiIcon size={14} color="#000000" />
                        <span>{vehicle?.number || 'UNKNOWN'}</span>
                      </div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {vehicle?.name || 'Vehicle'} · {request.dutyType}
                      </strong>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="admin-tracker-details">
                    <div>
                      <UserIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: '#64748b' }} />
                      <span>{supplier?.fullName || 'Supplier'} ({supplier?.city || 'Punjab'})</span>
                    </div>
                    <div>
                      <CalendarIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: '#64748b' }} />
                      <span>{request.pickupDate || 'Date pending'} {request.pickupTime ? `at ${request.pickupTime}` : ''}</span>
                    </div>
                    <div>
                      <MapPinIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: '#64748b' }} />
                      <span>{request.pickupLocation || 'Location pending'}</span>
                    </div>
                    {request.remarks && (
                      <div>
                        <MessageSquareIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1, color: '#64748b' }} />
                        <span>{request.remarks}</span>
                      </div>
                    )}
                  </div>

                  {supplier?.whatsapp && (
                    <div className="admin-tracker-actions">
                      <a
                        href={`https://wa.me/${supplier.whatsapp.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="admin-whatsapp-btn"
                      >
                        <WhatsAppIcon size={14} color="#ffffff" />
                        <span>WhatsApp Supplier</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Admin Password Confirmation Modal */}
      <AdminAuthModal
        isOpen={authModal.isOpen}
        title={authModal.title}
        actionDescription={authModal.actionDescription}
        confirmLabel={authModal.confirmLabel}
        onConfirm={authModal.onConfirm}
        onCancel={() => setAuthModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminOverviewPage;
