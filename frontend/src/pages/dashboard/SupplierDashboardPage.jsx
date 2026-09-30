import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  TaxiIcon,
  CarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
  MapPinIcon,
  WhatsAppIcon,
  RefreshIcon,
  FlagIcon,
  NavigationIcon,
  SearchIcon,
  PlusIcon,
  ClockIcon,
  VolumeOnIcon
} from '../../components/common/Icons';

const SupplierDashboardPage = () => {
  const {
    user,
    vehicles,
    suppliers,
    vehicleGroups,
    bookingRequests,
    completeBookingDuty,
    setVehicleStatus,
    refreshAllData,
    createVehicle,
    playSupplierDutyChime
  } = useAuth();
  const { showToast } = useToast();

  const groupNames = useMemo(() => {
    const list = (vehicleGroups || []).map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
    return list.length > 0 ? list : ['Dzire', 'Ertiga', 'Rumion', 'Crysta', 'Hycross', 'Innova', 'Sedan AC', 'SUV'];
  }, [vehicleGroups]);

  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'BOOKED'
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Supplier Add Vehicle Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: 'Dzire', number: '', model: '' });
  const [addLoading, setAddLoading] = useState(false);

  // Supplier-specific vehicles and bookings
  const myVehicles = useMemo(() => {
    if (!user?.id) return [];
    return vehicles.filter((v) => String(v.supplierId) === String(user.id));
  }, [vehicles, user?.id]);

  // Quota calculation
  const mySupplierRecord = useMemo(() => {
    return (suppliers || []).find((s) => String(s.id) === String(user?.id)) || user;
  }, [suppliers, user]);

  // Auto dismiss message banner after 5 seconds
  React.useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
    return () => clearTimeout(timer);
  }, [message.text]);

  const supplierQuota = mySupplierRecord?.vehicleLimit || user?.vehicleLimit || 5;
  const isQuotaFull = myVehicles.length >= supplierQuota;

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (isQuotaFull) {
      showToast(`Vehicle quota reached (${myVehicles.length}/${supplierQuota}). Contact admin via WhatsApp (8264083932) to increase limit.`, 'warning');
      return;
    }
    const cleanNumber = newVehicle.number.trim().toUpperCase();
    if (!cleanNumber) {
      showToast('Please enter a valid vehicle license plate number.', 'error');
      return;
    }
    setAddLoading(true);
    const chosenCategory = newVehicle.name || groupNames[0] || 'Dzire';
    const result = await createVehicle({
      name: chosenCategory,
      number: cleanNumber,
      model: newVehicle.model.trim() || `${chosenCategory} Commercial AC`,
      supplierId: user?.id
    });
    setAddLoading(false);
    if (result.success) {
      showToast(`Vehicle ${cleanNumber} registered successfully!`, 'success');
      setMessage({
        type: 'success',
        text: `Vehicle ${cleanNumber} registered successfully and added to your fleet!`
      });
      setNewVehicle({ name: groupNames[0] || 'Dzire', number: '', model: '' });
      setShowAddModal(false);
    } else {
      showToast(result.message || 'Failed to register vehicle.', 'error');
      setMessage({ type: 'error', text: result.message || 'Failed to register vehicle.' });
    }
  };


  const myRequests = useMemo(() => {
    if (!user?.id) return [];
    return bookingRequests.filter((r) => String(r.supplierId) === String(user.id));
  }, [bookingRequests, user?.id]);

  const pendingRequestsList = useMemo(() => {
    return myRequests.filter((r) => r.status === 'REQUESTED');
  }, [myRequests]);

  const activeDuties = useMemo(() => {
    return myRequests.filter((r) => r.status === 'CONFIRMED');
  }, [myRequests]);

  const pendingRequests = pendingRequestsList.length;
  const availableVehicles = myVehicles.filter((v) => v.status === 'AVAILABLE').length;
  const bookedVehicles = myVehicles.filter((v) => v.status === 'BOOKED').length;

  // 1-Tap direct availability button handlers
  const handleSetStatus = async (vehicle, targetStatus) => {
    if (vehicle.status === targetStatus) return;
    if (vehicle.status === 'REQUESTED' || vehicle.status === 'CONFIRMED') return;

    await setVehicleStatus(vehicle.id, targetStatus);
    setMessage({
      type: targetStatus === 'AVAILABLE' ? 'success' : 'info',
      text: `${vehicle.name} (${vehicle.number}) marked as ${
        targetStatus === 'AVAILABLE' ? 'Available' : 'Booked'
      }.`
    });
  };

  // Complete ongoing duty
  const handleDutyComplete = async (requestId, vehicleNumber) => {
    await completeBookingDuty(requestId);
    setMessage({
      type: 'success',
      text: `Duty finished! ${vehicleNumber || 'Vehicle'} is now Available for new bookings.`
    });
  };

  const filteredVehicles = useMemo(() => {
    return myVehicles.filter((vehicle) => {
      const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        !query || `${vehicle.name} ${vehicle.number} ${vehicle.model}`.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [myVehicles, search, statusFilter]);

  return (
    <div className="supplier-home-container">
      {/* 1. Header Bar: Profile, live stats & controls */}
      <header className="supplier-header-card">
        <div className="supplier-profile-row">
          <div className="supplier-avatar">
            {(user?.fullName || user?.companyName || user?.username || 'S').charAt(0).toUpperCase()}
          </div>
          <div className="supplier-info">
            <h1 className="supplier-title">{user?.fullName || user?.companyName || 'My Fleet'}</h1>
            <div className="supplier-submeta">
              {user?.city && (
                <span className="meta-badge">
                  <MapPinIcon size={12} color="#93c5fd" />
                  <span>{user.city}</span>
                </span>
              )}
              {user?.whatsapp && (
                <span className="meta-badge">
                  <WhatsAppIcon size={12} color="#4ade80" />
                  <span>{user.whatsapp}</span>
                </span>
              )}
              <span className="meta-badge fleet-count">
                <CarIcon size={12} color="#fde68a" />
                <span>{myVehicles.length} / {supplierQuota} Vehicles (Quota)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="supplier-controls-row">
          <a
            href={`https://wa.me/918264083932?text=${encodeURIComponent(`Hello Fleetza Operations Admin, this is ${user?.fullName || user?.companyName || 'Supplier'} (${user?.city || 'Punjab'}). I need assistance.`)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="ctrl-btn admin-wa-btn"
            title="Chat with Admin Business WhatsApp (8264083932)"
          >
            <WhatsAppIcon size={14} color="#ffffff" />
            <span>Admin Desk</span>
          </a>

          <button
            type="button"
            className="ctrl-btn refresh-btn"
            onClick={refreshAllData}
            title="Refresh status now"
          >
            <RefreshIcon size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Status Feedback Banner */}
      {message.text && (
        <div className={`alert-banner ${message.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? (
              <CheckCircleIcon size={16} color="#059669" />
            ) : (
              <CheckCircleIcon size={16} color="#2563eb" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            className="close-alert-btn"
            onClick={() => setMessage({ type: '', text: '' })}
            aria-label="Dismiss message"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Ongoing Active Duties in Progress */}
      {activeDuties.length > 0 && (
        <section className="active-duties-section">
          <div className="active-duties-header">
            <NavigationIcon size={16} color="#ffffff" />
            <strong>ACTIVE DUTY IN PROGRESS ({activeDuties.length})</strong>
          </div>

          <div className="active-duties-list">
            {activeDuties.map((duty) => {
              const vehicle = myVehicles.find((item) => String(item.id) === String(duty.vehicleId));
              return (
                <div className="active-duty-card" key={duty.id}>
                  <div className="duty-card-top">
                    <div className="plate-badge">
                      <TaxiIcon size={15} color="#000000" />
                      <span>{vehicle?.number || 'VEHICLE'}</span>
                    </div>
                    <StatusBadge status="CONFIRMED" />
                  </div>

                  <div className="duty-card-body">
                    <strong>{vehicle?.name || 'Vehicle'}</strong> · {duty.dutyType || '8/80'}
                    <div className="duty-card-loc">
                      <MapPinIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                      <span>{duty.pickupLocation || 'On Duty'}</span>
                      {duty.dropLocation && <span> ➔ 🏁 {duty.dropLocation}</span>}
                      {duty.pickupTime && <span> · 🕒 {duty.pickupTime}</span>}
                    </div>
                    {duty.passengerName && (
                      <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: 3 }}>
                        👤 {duty.passengerName}{duty.passengerPhone ? ` (${duty.passengerPhone})` : ''}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-complete-duty"
                    onClick={() => handleDutyComplete(duty.id, vehicle?.number)}
                  >
                    <FlagIcon size={16} />
                    <span>DUTY COMPLETED · FREE CAR</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. MAIN FRONT SECTION: VEHICLE CARDS WITH TWO DIRECT BUTTONS (BOOK & AVAILABLE) */}
      <section className="supplier-fleet-section">
        <div className="fleet-section-topbar">
          <div className="fleet-section-title">
            <TaxiIcon size={22} color="var(--color-primary)" />
            <h2>My Vehicles</h2>
            <span className="vehicles-count-pill">{myVehicles.length} Cars</span>
          </div>

          <div className="topbar-right-actions">
            {/* Quick Filter Buttons */}
            <div className="quick-filter-row filter-chips-scroll">
              <button
                type="button"
                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({myVehicles.length})
              </button>
              <button
                type="button"
                className={`filter-btn available-filter ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
                onClick={() => setStatusFilter('AVAILABLE')}
              >
                <CheckCircleIcon size={13} color={statusFilter === 'AVAILABLE' ? '#ffffff' : '#10b981'} style={{ verticalAlign: -2, marginRight: 4 }} />
                Available ({availableVehicles})
              </button>
              <button
                type="button"
                className={`filter-btn booked-filter ${statusFilter === 'BOOKED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('BOOKED')}
              >
                <XCircleIcon size={13} color={statusFilter === 'BOOKED' ? '#ffffff' : '#ef4444'} style={{ verticalAlign: -2, marginRight: 4 }} />
                Booked ({bookedVehicles})
              </button>
            </div>

            {/* Quota Badge */}
            <div
              style={{
                background: isQuotaFull ? '#fee2e2' : '#f0fdf4',
                color: isQuotaFull ? '#991b1b' : '#166534',
                border: '1px solid ' + (isQuotaFull ? '#fecaca' : '#bbf7d0'),
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>Quota: {myVehicles.length} / {supplierQuota}</span>
            </div>

            {/* Direct Supplier Add Vehicle Button */}
            <button
              type="button"
              className="btn-add-vehicle-top"
              disabled={isQuotaFull}
              onClick={() => {
                if (isQuotaFull) {
                  showToast(`Vehicle quota reached (${myVehicles.length}/${supplierQuota}). Contact admin to increase limit.`, 'warning');
                  return;
                }
                setShowAddModal(true);
              }}
              title={isQuotaFull ? 'Vehicle quota reached' : 'Register a new car to your fleet'}
            >
              <PlusIcon size={14} />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>

        {/* Quick Search */}
        {myVehicles.length > 3 && (
          <div className="fleet-search-box" style={{ position: 'relative' }}>
            <SearchIcon size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
            <input
              type="text"
              className="fleet-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plate number or car name..."
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        )}

        {/* Empty state if supplier has no vehicles */}
        {filteredVehicles.length === 0 ? (
          <div className="empty-fleet-card">
            <div className="empty-icon">
              <CarIcon size={42} color="#94a3b8" />
            </div>
            <h3>No vehicles to display</h3>
            <p>
              {myVehicles.length === 0
                ? 'You do not have any vehicles registered yet. Add your vehicle to begin receiving duty dispatches!'
                : 'No vehicles match your current search or filter.'}
            </p>
            <button
              type="button"
              className="btn-add-vehicle-top"
              onClick={() => setShowAddModal(true)}
              style={{ marginTop: '0.85rem' }}
            >
              <PlusIcon size={15} />
              <span>Register Your Vehicle Now</span>
            </button>
          </div>
        ) : (
          <div className="vehicle-cards-grid">
            {filteredVehicles.map((vehicle) => {
              const isAvailable = vehicle.status === 'AVAILABLE';
              const isBooked = vehicle.status === 'BOOKED';
              const isRequested = vehicle.status === 'REQUESTED';
              const isConfirmed = vehicle.status === 'CONFIRMED';

              return (
                <div
                  key={vehicle.id}
                  className={`vehicle-card ${
                    isAvailable ? 'card-available' : isBooked ? 'card-booked' : 'card-locked'
                  }`}
                >
                  {/* Card Header: Plate number, car name and status */}
                  <div className="vehicle-card-head">
                    <div className="plate-badge">
                      <TaxiIcon size={15} color="#000000" />
                      <span>{vehicle.number}</span>
                    </div>
                    <StatusBadge status={vehicle.status} />
                  </div>

                  {/* Vehicle Details */}
                  <div className="vehicle-card-details">
                    <h3 className="vehicle-card-name">{vehicle.name}</h3>
                    <div className="vehicle-card-model">
                      {vehicle.model || 'Commercial Taxi'}
                    </div>
                  </div>

                  {/* TWO BUTTONS: (Available & Book) */}
                  <div className="vehicle-two-buttons">
                    <button
                      type="button"
                      className={`btn-state-available ${isAvailable ? 'is-selected' : ''}`}
                      disabled={isRequested || isConfirmed}
                      onClick={() => handleSetStatus(vehicle, 'AVAILABLE')}
                      title="Set vehicle available for new bookings"
                    >
                      {isAvailable ? (
                        <CheckIcon size={17} color="#ffffff" />
                      ) : (
                        <CheckCircleIcon size={16} color="#10b981" />
                      )}
                      <span>{isAvailable ? 'Available' : 'Available'}</span>
                    </button>

                    <button
                      type="button"
                      className={`btn-state-booked ${isBooked ? 'is-selected' : ''}`}
                      disabled={isRequested || isConfirmed}
                      onClick={() => handleSetStatus(vehicle, 'BOOKED')}
                      title="Set vehicle booked or busy"
                    >
                      {isBooked ? (
                        <CheckIcon size={17} color="#ffffff" />
                      ) : (
                        <XCircleIcon size={16} color="#ef4444" />
                      )}
                      <span>{isBooked ? 'Booked' : 'Booked'}</span>
                    </button>
                  </div>

                  {/* Duty lock indicators if vehicle is locked */}
                  {isRequested && (
                    <div className="locked-banner request-locked">
                      <ClockIcon size={14} color="#854d0e" />
                      <span>Duty Requested — Accept/Decline Above</span>
                    </div>
                  )}

                  {isConfirmed && (
                    <div className="locked-banner duty-locked">
                      <NavigationIcon size={14} color="#1e40af" />
                      <span>On Duty — Complete Trip Above</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Supplier Register New Vehicle Modal */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <section className="edit-modal" role="dialog" aria-modal="true" style={{ maxWidth: '460px' }}>
            <div className="panel-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <TaxiIcon size={24} color="#f59e0b" />
                <div>
                  <span className="eyebrow">Fleet Registration</span>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Register New Vehicle</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Vehicle Category / Group *</label>
                <select
                  className="form-input"
                  value={newVehicle.name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  required
                >
                  {groupNames.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">License Plate Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVehicle.number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value.toUpperCase() })}
                  placeholder="e.g. PB01AB1234"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Model Year / Specifics</label>
                <input
                  type="text"
                  className="form-input"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  placeholder="e.g. 2024 White Sedan AC"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="filter-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                  style={{ minWidth: '90px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-add-vehicle-top"
                  disabled={addLoading || !newVehicle.number.trim()}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  <PlusIcon size={15} />
                  <span>{addLoading ? 'Registering...' : 'Add Vehicle'}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboardPage;
