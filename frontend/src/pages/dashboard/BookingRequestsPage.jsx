import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import {
  TaxiIcon,
  CarIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  WhatsAppIcon,
  UserIcon,
  ZapIcon,
  MessageSquareIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon
} from '../../components/common/Icons';

const getTodayDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getUpcomingTime = (minutesAhead = 30) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesAhead);
  return d.toTimeString().slice(0, 5);
};

const emptyFormState = () => ({
  vehicleId: '',
  pickupDate: getTodayDate(),
  pickupTime: getUpcomingTime(30),
  dutyType: '8/80',
  pickupLocation: '',
  dropLocation: '',
  passengerName: '',
  passengerPhone: '',
  remarks: ''
});

const BookingRequestsPage = () => {
  const { vehicles, suppliers, cities, bookingRequests: requests, createBookingRequest } = useAuth();
  const { showToast } = useToast();

  const cityNames = useMemo(() => {
    return (cities || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
  }, [cities]);

  const [form, setForm] = useState(emptyFormState);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('AVAILABLE'); // default to Ready for fast dispatch
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Network-wide available
  const networkAvailable = vehicles.filter((v) => v.status === 'AVAILABLE');

  // Filter vehicles by selected city
  const cityVehicles = useMemo(() => {
    if (!selectedCity || selectedCity === 'ALL') return vehicles;
    const selLower = selectedCity.trim().toLowerCase();
    return vehicles.filter((v) => {
      const supplier = suppliers.find((s) => String(s.id) === String(v.supplierId));
      const sCity = (supplier?.city || v.city || '').trim().toLowerCase();
      return sCity === selLower;
    });
  }, [vehicles, suppliers, selectedCity]);

  const cityAvailableCount = cityVehicles.filter((v) => v.status === 'AVAILABLE').length;
  const cityBookedCount = cityVehicles.filter((v) => v.status !== 'AVAILABLE').length;

  // Filtered by search & availability
  const filteredVehicles = useMemo(() => {
    return cityVehicles.filter((vehicle) => {
      const supplier = suppliers.find((item) => String(item.id) === String(vehicle.supplierId));
      const query = vehicleSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${vehicle.name || ''} ${vehicle.number || ''} ${vehicle.model || ''} ${vehicle.category || ''} ${supplier?.fullName || ''} ${supplier?.companyName || ''} ${supplier?.city || ''} ${vehicle.city || ''}`
          .toLowerCase()
          .includes(query);

      const matchesAvailability =
        availabilityFilter === 'ALL'
          ? true
          : availabilityFilter === 'AVAILABLE'
          ? vehicle.status === 'AVAILABLE'
          : vehicle.status !== 'AVAILABLE';

      return matchesSearch && matchesAvailability;
    });
  }, [cityVehicles, suppliers, vehicleSearch, availabilityFilter]);

  // Selected vehicle details
  const selectedVehicle = useMemo(() => {
    if (!form.vehicleId) return null;
    return vehicles.find((v) => String(v.id) === String(form.vehicleId)) || null;
  }, [vehicles, form.vehicleId]);

  const selectedVehicleSupplier = useMemo(() => {
    if (!selectedVehicle) return null;
    return suppliers.find((s) => String(s.id) === String(selectedVehicle.supplierId)) || null;
  }, [suppliers, selectedVehicle]);

  const canDispatch = selectedVehicle && selectedVehicle.status === 'AVAILABLE';

  const updateForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSelectVehicle = (vehicle) => {
    if (vehicle.status !== 'AVAILABLE') {
      showToast(
        `Vehicle ${vehicle.number} is currently ${vehicle.status}. You cannot dispatch duty to a booked vehicle!`,
        'error'
      );
      return;
    }
    setForm((prev) => ({ ...prev, vehicleId: vehicle.id }));
    showToast(`Selected ${vehicle.number} (${vehicle.name}) for dispatch.`, 'info');
  };

  const handleSetQuickDate = (daysFromToday) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    setForm((prev) => ({ ...prev, pickupDate: d.toISOString().split('T')[0] }));
  };

  const handleSetQuickTime = (minutesAhead) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesAhead);
    setForm((prev) => ({ ...prev, pickupTime: d.toTimeString().slice(0, 5) }));
  };

  const createRequest = async (openWhatsApp) => {
    if (!form.vehicleId) {
      showToast('Please select a ready vehicle from the fleet list first.', 'warning');
      return;
    }

    if (!selectedVehicle || selectedVehicle.status !== 'AVAILABLE') {
      showToast(
        `Cannot dispatch duty: Selected vehicle is ${selectedVehicle?.status || 'Unavailable'}.`,
        'error'
      );
      return;
    }

    const result = await createBookingRequest({
      vehicleId: form.vehicleId,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      dutyType: form.dutyType || '8/80',
      pickupLocation: form.pickupLocation,
      dropLocation: form.dropLocation,
      passengerName: form.passengerName,
      passengerPhone: form.passengerPhone,
      remarks: form.remarks,
      message: form.remarks
    });
    if (!result.success) {
      showToast(result.message || 'Failed to dispatch booking request.', 'error');
      return;
    }

    setForm({
      ...emptyFormState(),
      dutyType: form.dutyType || '8/80'
    });

    const successMsg = openWhatsApp
      ? `Dispatched for ${selectedVehicle.name} (${selectedVehicle.number}) and WhatsApp opened!`
      : `Dispatched live to ${selectedVehicleSupplier?.fullName}'s portal!`;
    showToast(successMsg, 'success');

    if (openWhatsApp && selectedVehicleSupplier?.whatsapp) {
      const phone = selectedVehicleSupplier.whatsapp.replace(/[^\d]/g, '');
      const lines = [
        `*FLEETZA BOOKING REQUEST*`,
        ``,
        `Supplier: ${selectedVehicleSupplier.fullName}`,
        `Vehicle: ${selectedVehicle.name} (${selectedVehicle.number})`,
        `Duty: ${result.request?.dutyType || form.dutyType || '8/80'}`,
        `Date: ${result.request?.pickupDate || form.pickupDate || 'Today'} at ${result.request?.pickupTime || form.pickupTime || ''}`
      ];

      if (form.passengerName || form.passengerPhone) {
        lines.push(`Passenger: ${[form.passengerName, form.passengerPhone].filter(Boolean).join(' - ')}`);
      }
      if (form.pickupLocation) {
        lines.push(`Pickup: ${form.pickupLocation}`);
      }
      if (form.dropLocation) {
        lines.push(`Drop: ${form.dropLocation}`);
      }
      if (form.remarks) {
        lines.push(`Remarks: ${form.remarks}`);
      }
      lines.push(``, `Fleetza Operations Desk`);

      const text = lines.join('\n');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Active bookings list
  const activeRequests = requests.filter((r) => {
    const isLive = r.status === 'REQUESTED' || r.status === 'CONFIRMED';
    return isLive && (statusFilter === 'ALL' || r.status === statusFilter);
  });

  return (
    <div className="dispatch-compact-container">
      {/* 1. Header Toolbar with Integrated City Filter (Slim & Space Efficient) */}
      <div className="dispatch-toolbar">
        <div className="dispatch-toolbar-left">
          <h1 className="dispatch-toolbar-title">
            <ZapIcon size={18} color="#f59e0b" />
            <span>Booking Requests & Dispatch</span>
          </h1>
          <span className="dispatch-net-pill">
            <span className="admin-pulse-dot" />
            <span>{networkAvailable.length} Ready Online</span>
          </span>
        </div>

        {/* City Filter Pills */}
        <div className="city-scroll-toolbar">
          <button
            type="button"
            className={`city-pill-tab ${selectedCity === 'ALL' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCity('ALL');
              setForm((prev) => ({ ...prev, vehicleId: '' }));
            }}
          >
            <span>All Cities</span>
            <span className="city-pill-count">{networkAvailable.length}</span>
          </button>
          {cityNames.map((city) => {
            const availInCity = vehicles.filter((v) => {
              if (v.status !== 'AVAILABLE') return false;
              const s = suppliers.find((item) => String(item.id) === String(v.supplierId));
              return (s?.city || v.city || '').trim().toLowerCase() === city.trim().toLowerCase();
            }).length;

            return (
              <button
                type="button"
                key={city}
                className={`city-pill-tab ${selectedCity === city ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCity(city);
                  setForm((prev) => ({ ...prev, vehicleId: '' }));
                }}
              >
                <MapPinIcon size={11} />
                <span>{city}</span>
                <span className="city-pill-count">{availInCity}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Split Deck: Left = Vehicle Picker | Right = Quick Dispatch Form */}
      <div className="dispatch-split-deck">
        {/* Left Column: Select Vehicle */}
        <div className="dispatch-panel-card">
          <div className="dispatch-panel-header">
            <h2 className="dispatch-panel-heading">
              <CarIcon size={15} color="var(--color-primary)" />
              <span>Select Vehicle ({selectedCity === 'ALL' ? 'All Cities' : selectedCity})</span>
            </h2>
            <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.72rem', fontWeight: 700 }}>
              <span style={{ color: '#16a34a' }}>● {cityAvailableCount} Ready</span>
              <span style={{ color: '#dc2626' }}>● {cityBookedCount} Booked</span>
            </div>
          </div>

          {/* Quick Search & Availability Tabs */}
          <div className="dispatch-search-filter-row">
            <div className="dispatch-search-box">
              <SearchIcon size={13} style={{ position: 'absolute', left: 8, top: 10, color: '#94a3b8' }} />
              <input
                type="text"
                className="dispatch-input-sm"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Search car, plate, supplier..."
                style={{ paddingLeft: '1.75rem', height: '32px' }}
              />
            </div>
            <div className="dispatch-filter-chips-row">
              <button
                type="button"
                className={`filter-chip ${availabilityFilter === 'AVAILABLE' ? 'active' : ''}`}
                onClick={() => setAvailabilityFilter('AVAILABLE')}
              >
                Ready ({cityAvailableCount})
              </button>
              <button
                type="button"
                className={`filter-chip ${availabilityFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setAvailabilityFilter('ALL')}
              >
                All ({cityVehicles.length})
              </button>
              <button
                type="button"
                className={`filter-chip ${availabilityFilter === 'BOOKED' ? 'active' : ''}`}
                onClick={() => setAvailabilityFilter('BOOKED')}
              >
                Booked ({cityBookedCount})
              </button>
            </div>
          </div>

          {/* High Density Vehicle List */}
          {filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#64748b', fontSize: '0.78rem' }}>
              <CarIcon size={24} color="#94a3b8" />
              <p style={{ margin: '0.35rem 0 0' }}>No vehicles match filter in this city.</p>
            </div>
          ) : (
            <div className="dispatch-vehicle-list">
              {filteredVehicles.map((vehicle) => {
                const supplier = suppliers.find((s) => String(s.id) === String(vehicle.supplierId));
                const isSelected = String(form.vehicleId) === String(vehicle.id);
                const isAvailable = vehicle.status === 'AVAILABLE';

                let rowClass = 'dispatch-car-row';
                if (isSelected) rowClass += ' selected';
                if (!isAvailable) rowClass += ' booked';

                return (
                  <div
                    key={vehicle.id}
                    className={rowClass}
                    onClick={() => handleSelectVehicle(vehicle)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="dispatch-car-left">
                      <div className="plate-badge" style={{ fontSize: '0.74rem', padding: '0.12rem 0.4rem' }}>
                        <TaxiIcon size={12} color="#000000" />
                        <span>{vehicle.number}</span>
                      </div>
                      <div className="dispatch-car-info">
                        <span className="dispatch-car-name">{vehicle.name} · {vehicle.model}</span>
                        <span className="dispatch-car-meta">
                          {supplier?.fullName || 'Supplier'} ({supplier?.city || vehicle.city || 'Punjab'})
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                      <StatusBadge status={vehicle.status} />
                      {isAvailable && (
                        <span style={{ fontSize: '0.7rem', color: isSelected ? 'var(--color-primary)' : '#64748b', fontWeight: 700 }}>
                          {isSelected ? '✓ Selected' : 'Select'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Duty Details & Dispatch */}
        <div className="dispatch-panel-card">
          <div className="dispatch-panel-header">
            <h2 className="dispatch-panel-heading">
              <ZapIcon size={15} color="#f59e0b" />
              <span>Duty Dispatch Form</span>
            </h2>
            {selectedVehicle && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, vehicleId: '' }))}
                style={{ fontSize: '0.72rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          {selectedVehicle ? (
            <div className="dispatch-form-compact">
              {/* Selected Car Banner */}
              <div className="dispatch-selected-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div className="plate-badge" style={{ fontSize: '0.74rem', padding: '0.12rem 0.4rem' }}>
                    <TaxiIcon size={12} color="#000000" />
                    <span>{selectedVehicle.number}</span>
                  </div>
                  <strong style={{ fontSize: '0.8rem', color: '#166534' }}>
                    {selectedVehicle.name} ({selectedVehicle.model})
                  </strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <UserIcon size={11} />
                  <span>{selectedVehicleSupplier?.fullName}</span>
                </div>
              </div>

              {/* Duty Package */}
              <div className="dispatch-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Duty Package</label>
                  <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 600 }}>Default: 8h / 80km</span>
                </div>
                <div className="dispatch-duty-pills">
                  {[
                    { id: '4/40', label: '4h / 40km' },
                    { id: '8/80', label: '8h / 80km' },
                    { id: 'OUTSTATION', label: 'Outstation' }
                  ].map((duty) => (
                    <button
                      type="button"
                      key={duty.id}
                      className={`dispatch-duty-pill-btn ${form.dutyType === duty.id ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, dutyType: duty.id })}
                    >
                      {duty.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passenger Info (Optional) */}
              <div className="dispatch-input-row">
                <div className="dispatch-form-group">
                  <label>Passenger Name <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                  <input
                    type="text"
                    name="passengerName"
                    className="dispatch-input-sm"
                    value={form.passengerName}
                    onChange={updateForm}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div className="dispatch-form-group">
                  <label>Passenger Phone <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                  <input
                    type="tel"
                    name="passengerPhone"
                    className="dispatch-input-sm"
                    value={form.passengerPhone}
                    onChange={updateForm}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="dispatch-input-row">
                <div className="dispatch-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Pickup Date <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => handleSetQuickDate(0)}
                        style={{ fontSize: '0.65rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '3px', cursor: 'pointer', padding: '0.05rem 0.3rem' }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickDate(1)}
                        style={{ fontSize: '0.65rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '3px', cursor: 'pointer', padding: '0.05rem 0.3rem' }}
                      >
                        Tmrw
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    name="pickupDate"
                    className="dispatch-input-sm"
                    value={form.pickupDate}
                    onChange={updateForm}
                  />
                </div>

                <div className="dispatch-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Pickup Time <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => handleSetQuickTime(30)}
                        style={{ fontSize: '0.65rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '3px', cursor: 'pointer', padding: '0.05rem 0.3rem' }}
                      >
                        +30m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetQuickTime(60)}
                        style={{ fontSize: '0.65rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '3px', cursor: 'pointer', padding: '0.05rem 0.3rem' }}
                      >
                        +1h
                      </button>
                    </div>
                  </div>
                  <input
                    type="time"
                    name="pickupTime"
                    className="dispatch-input-sm"
                    value={form.pickupTime}
                    onChange={updateForm}
                  />
                </div>
              </div>

              {/* Locations (Optional) */}
              <div className="dispatch-input-row">
                <div className="dispatch-form-group">
                  <label>Pickup Location <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                  <input
                    type="text"
                    name="pickupLocation"
                    className="dispatch-input-sm"
                    value={form.pickupLocation}
                    onChange={updateForm}
                    placeholder="e.g. Sector 17, Chandigarh / Airport"
                  />
                </div>

                <div className="dispatch-form-group">
                  <label>Drop Location(s) <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                  <input
                    type="text"
                    name="dropLocation"
                    className="dispatch-input-sm"
                    value={form.dropLocation}
                    onChange={updateForm}
                    placeholder="e.g. Delhi Airport T3 / Hotel"
                  />
                </div>
              </div>

              <div className="dispatch-form-group">
                <label>Guest / Trip Remarks <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                <input
                  type="text"
                  name="remarks"
                  className="dispatch-input-sm"
                  value={form.remarks}
                  onChange={updateForm}
                  placeholder="e.g. Flight arrives 16:30, 2 bags, AC on"
                />
              </div>

              <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', margin: '0.1rem 0' }}>
                * All fields are optional to fill. Ready for 1-click dispatch with default 8h / 80km package.
              </div>

              {/* Action Buttons */}
              <div className="dispatch-actions-row">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => createRequest(false)}
                  disabled={!form.vehicleId || !canDispatch}
                  style={{ flex: 1, minHeight: '34px', fontSize: '0.8rem' }}
                >
                  <ZapIcon size={14} style={{ marginRight: 4 }} />
                  <span>Send to Inbox</span>
                </Button>

                <Button
                  type="button"
                  variant="success"
                  size="sm"
                  onClick={() => createRequest(true)}
                  disabled={!form.vehicleId || !canDispatch}
                  style={{ flex: 1, minHeight: '34px', fontSize: '0.8rem' }}
                >
                  <WhatsAppIcon size={14} color="#ffffff" style={{ marginRight: 4 }} />
                  <span>WhatsApp</span>
                </Button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px',
              border: '1.5px dashed #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              textAlign: 'center',
              background: '#f8fafc',
              color: '#64748b'
            }}>
              <TaxiIcon size={32} color="#94a3b8" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>
                No Vehicle Selected
              </strong>
              <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0', maxWidth: '240px' }}>
                Tap on any ready car on the left to quickly configure and dispatch duty.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Card: Live Active Dispatches (Compact Tracker) */}
      <div className="dispatch-panel-card">
        <div className="dispatch-panel-header">
          <h2 className="dispatch-panel-heading">
            <ClockIcon size={15} color="#3b82f6" />
            <span>Active Duties Queue ({activeRequests.length})</span>
          </h2>

          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              type="button"
              className={`filter-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', height: '26px' }}
            >
              All ({requests.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${statusFilter === 'REQUESTED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('REQUESTED')}
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', height: '26px' }}
            >
              Waiting
            </button>
            <button
              type="button"
              className={`filter-chip ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CONFIRMED')}
              style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', height: '26px' }}
            >
              On Duty
            </button>
          </div>
        </div>

        {activeRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.76rem' }}>
            No live booking requests currently match this filter.
          </div>
        ) : (
          <div className="dispatch-tracker-wrap">
            {activeRequests.slice().reverse().map((request) => {
              const vehicle = vehicles.find((item) => String(item.id) === String(request.vehicleId));
              const supplier = suppliers.find((item) => String(item.id) === String(request.supplierId));
              const isConfirmed = request.status === 'CONFIRMED';
              const isRequested = request.status === 'REQUESTED';

              return (
                <div
                  key={request.id}
                  className={`dispatch-tracker-compact-row ${isConfirmed ? 'confirmed' : isRequested ? 'requested' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div className="plate-badge" style={{ fontSize: '0.74rem', padding: '0.12rem 0.4rem' }}>
                      <TaxiIcon size={12} color="#000000" />
                      <span>{vehicle?.number || 'UNKNOWN'}</span>
                    </div>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {vehicle?.name || 'Vehicle'} · {request.dutyType}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      · {supplier?.fullName || 'Supplier'} ({supplier?.city || 'Punjab'})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>📅 {request.pickupDate || 'Today'} {request.pickupTime ? `at ${request.pickupTime}` : ''}</span>
                      {request.passengerName && (
                        <span>👤 {request.passengerName}{request.passengerPhone ? ` (${request.passengerPhone})` : ''}</span>
                      )}
                      {request.pickupLocation && <span>📍 {request.pickupLocation}</span>}
                      {request.dropLocation && <span>🏁 {request.dropLocation}</span>}
                    </div>

                    <StatusBadge status={request.status} />

                    {supplier?.whatsapp && (
                      <a
                        href={`https://wa.me/${supplier.whatsapp.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          background: '#25d366',
                          color: '#ffffff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <WhatsAppIcon size={11} color="#ffffff" />
                        <span>Chat</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingRequestsPage;
