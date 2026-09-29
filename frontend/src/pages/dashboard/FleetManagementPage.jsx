import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import StatusBadge from '../../components/common/StatusBadge';
import {
  TaxiIcon,
  CarIcon,
  PlusIcon,
  XIcon,
  SearchIcon,
  MapPinIcon,
  UserIcon,
  WhatsAppIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  NavigationIcon,
  AlertTriangleIcon
} from '../../components/common/Icons';

const blankVehicle = { name: '', number: '', model: '', supplierId: '' };

const FleetManagementPage = () => {
  const {
    vehicles,
    suppliers,
    cities,
    vehicleGroups,
    updateVehicle,
    createVehicle,
    setVehicleStatus,
    deleteVehicle,
    getVehicles,
    user,
    hasRole
  } = useAuth();

  const { showToast } = useToast();
  const isSupplier = hasRole('SUPPLIER');

  const cityNames = useMemo(() => {
    return (cities || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
  }, [cities]);

  const groupNames = useMemo(() => {
    const list = (vehicleGroups || []).map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
    return list.length > 0 ? list : ['Dzire', 'Ertiga', 'Rumion', 'Crysta', 'Hycross', 'Innova', 'Sedan AC', 'SUV'];
  }, [vehicleGroups]);

  const [city, setCity] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ ...blankVehicle, name: groupNames[0] || 'Dzire' });

  // Supplier's quota calculations
  const mySupplierRecord = useMemo(() => {
    if (!isSupplier) return null;
    return suppliers.find((s) => String(s.id) === String(user?.id)) || user;
  }, [isSupplier, suppliers, user]);

  const supplierQuota = mySupplierRecord?.vehicleLimit || user?.vehicleLimit || 5;

  const relevantVehicles = useMemo(() => {
    if (isSupplier) {
      return vehicles.filter((v) => String(v.supplierId) === String(user?.id));
    }
    return vehicles;
  }, [vehicles, isSupplier, user?.id]);

  const isQuotaFull = isSupplier && relevantVehicles.length >= supplierQuota;
  const availableCount = relevantVehicles.filter((v) => v.status === 'AVAILABLE').length;

  const saveEdit = async (event) => {
    event.preventDefault();
    if (isSupplier) {
      showToast('Suppliers are not allowed to edit vehicle details.', 'error');
      return;
    }
    const result = await updateVehicle(editing.id, editing);
    if (!result.success) {
      showToast(result.message || 'Failed to update vehicle', 'error');
      return;
    }
    showToast(`Vehicle ${editing.number} updated successfully.`, 'success');
    setEditing(null);
  };

  const handleCreateVehicle = async (event) => {
    event.preventDefault();
    const targetSupplierId = isSupplier ? user?.id : newVehicle.supplierId;
    if (!targetSupplierId) {
      showToast('Please select which supplier owns this vehicle.', 'error');
      return;
    }

    if (isSupplier && isQuotaFull) {
      showToast(`Vehicle limit reached (${relevantVehicles.length}/${supplierQuota}). Contact admin via WhatsApp (8264083932) to increase quota.`, 'error');
      return;
    }

    const groupToUse = newVehicle.name || groupNames[0] || 'Dzire';
    const result = await createVehicle({
      name: groupToUse,
      number: newVehicle.number,
      model: newVehicle.model || groupToUse,
      supplierId: Number(targetSupplierId)
    });

    if (!result.success) {
      showToast(result.message || 'Failed to register vehicle', 'error');
      return;
    }

    showToast(`Vehicle ${newVehicle.number.toUpperCase()} registered successfully.`, 'success');
    setNewVehicle({ ...blankVehicle, name: groupNames[0] || 'Dzire' });
    setAddOpen(false);
  };

  const removeVehicle = async (vehicle) => {
    if (isSupplier) {
      showToast('Suppliers cannot delete vehicles. Contact Admin via WhatsApp (8264083932).', 'error');
      return;
    }
    if (window.confirm(`Delete vehicle ${vehicle.name} (${vehicle.number}) from the fleet?`)) {
      const res = await deleteVehicle(vehicle.id);
      if (res.success) {
        showToast(`Vehicle ${vehicle.number} deleted successfully.`, 'info');
      } else {
        showToast(res.message || 'Failed to delete vehicle', 'error');
      }
    }
  };

  const handleToggleStatus = async (vehicle) => {
    const isAvailable = vehicle.status === 'AVAILABLE';
    const next = isAvailable ? 'BOOKED' : 'AVAILABLE';
    const res = await setVehicleStatus(vehicle.id, next);
    if (res.success) {
      showToast(`${vehicle.name} (${vehicle.number}) marked as ${next}.`, 'info');
    }
  };

  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [city, statusFilter, search]);

  const filteredVehicles = useMemo(() => {
    return relevantVehicles.filter((v) => {
      const supplier = suppliers.find((s) => String(s.id) === String(v.supplierId));
      const matchesCity = city === 'ALL' || (supplier?.city || '').toLowerCase() === city.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      const query = search.trim().toLowerCase();
      const matchesQuery =
        !query ||
        `${v.name} ${v.number} ${v.model} ${supplier?.fullName || ''} ${supplier?.city || ''}`
          .toLowerCase()
          .includes(query);
      return matchesCity && matchesStatus && matchesQuery;
    });
  }, [relevantVehicles, suppliers, city, statusFilter, search]);

  const displayedVehicles = useMemo(() => {
    return filteredVehicles.slice(0, visibleCount);
  }, [filteredVehicles, visibleCount]);

  return (
    <div className="admin-container">
      {/* 1. Header */}
      <div className="admin-hero-card">
        <div className="admin-hero-copy">
          <div className="admin-live-badge">
            <span className="admin-pulse-dot" />
            <span>{isSupplier ? 'MY FLEET' : 'FLEET REGISTRY'} ({relevantVehicles.length} Cars)</span>
          </div>
          <h1>{isSupplier ? 'My Vehicles' : 'Fleet Registry'}</h1>
          <p>
            {isSupplier
              ? 'View and register your commercial vehicles for duty dispatches. Set availability status live.'
              : 'Master fleet register across all operational cities and supplier partners.'}
          </p>
        </div>

        <div className="admin-hero-actions">
          {isSupplier && (
            <div
              style={{
                background: isQuotaFull ? '#fee2e2' : '#f0fdf4',
                color: isQuotaFull ? '#991b1b' : '#166534',
                border: '1px solid ' + (isQuotaFull ? '#fecaca' : '#bbf7d0'),
                borderRadius: '6px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>Quota: {relevantVehicles.length} / {supplierQuota} Cars</span>
            </div>
          )}

          <button
            type="button"
            className="admin-hero-btn primary"
            disabled={isSupplier && isQuotaFull}
            onClick={() => {
              if (isSupplier && isQuotaFull) {
                showToast(`Fleet quota full (${relevantVehicles.length}/${supplierQuota}). Contact admin via WhatsApp (8264083932) to increase quota.`, 'warning');
                return;
              }
              setNewVehicle({ ...blankVehicle, name: groupNames[0] || 'Dzire' });
              setAddOpen(!addOpen);
            }}
            title={isSupplier && isQuotaFull ? 'Vehicle quota reached' : 'Add Vehicle'}
          >
            <PlusIcon size={16} />
            <span>{addOpen ? 'Close Form' : '+ Add Vehicle'}</span>
          </button>
        </div>
      </div>

      {/* Supplier Quota Alert when full */}
      {isSupplier && isQuotaFull && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fef3c7',
            color: '#92400e',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '0.75rem 1rem',
            fontSize: 'var(--font-sm, 0.875rem)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          <AlertTriangleIcon size={18} color="#d97706" />
          <span>
            You have reached your assigned fleet limit of <strong>{supplierQuota} vehicles</strong> ({relevantVehicles.length}/{supplierQuota} registered). Contact Fleetza Admin via WhatsApp (<a href="https://wa.me/918264083932" target="_blank" rel="noreferrer noopener" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>8264083932</a>) to increase your vehicle quota.
          </span>
        </div>
      )}

      {/* 2. Collapsible Add Vehicle Form */}
      {addOpen && (
        <section
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1.5rem',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <PlusIcon size={18} />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-dark)' }}>
                Register New Commercial Taxi
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <XIcon size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateVehicle} className="dense-form">
            {!isSupplier && (
              <div className="form-group">
                <label className="form-label">Fleet Supplier Owner *</label>
                <select
                  className="form-input"
                  value={newVehicle.supplierId}
                  onChange={(e) => setNewVehicle({ ...newVehicle, supplierId: e.target.value })}
                  required
                >
                  <option value="">Select Supplier Partner</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.companyName || s.city}) · Quota: {getVehicles(s.id).length}/{s.vehicleLimit || 5}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Vehicle Category / Group *</label>
              <select
                className="form-input"
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                required
              >
                {groupNames.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <Input
              label="License Plate Number *"
              value={newVehicle.number}
              onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })}
              placeholder="e.g. PB01AB1234"
              required
            />

            <Input
              label="Model / Description / Year *"
              value={newVehicle.model}
              onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
              placeholder="e.g. 2024 White Sedan AC"
              required
            />

            <div className="full-span" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Register Vehicle
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* 3. Filters Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plate, car, or supplier..."
            style={{ height: '40px' }}
          />
        </div>

        {!isSupplier && (
          <div className="filter-chips-scroll">
            <button
              type="button"
              className={`filter-chip ${city === 'ALL' ? 'active' : ''}`}
              onClick={() => setCity('ALL')}
            >
              All Cities ({relevantVehicles.length})
            </button>
            {cityNames.map((c) => {
              const count = relevantVehicles.filter((v) => {
                const s = suppliers.find((sup) => String(sup.id) === String(v.supplierId));
                return (s?.city || '').toLowerCase() === c.toLowerCase();
              }).length;
              if (count === 0) return null;
              return (
                <button
                  type="button"
                  key={c}
                  className={`filter-chip ${city.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setCity(c)}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="filter-chips-scroll" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`dco-tab-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          style={{ minHeight: '36px', fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        >
          All ({relevantVehicles.length})
        </button>

        <button
          type="button"
          className={`dco-tab-btn ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
          onClick={() => setStatusFilter('AVAILABLE')}
          style={{ minHeight: '36px', fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        >
          <CheckCircleIcon size={13} color={statusFilter === 'AVAILABLE' ? '#ffffff' : '#10b981'} style={{ marginRight: 4, verticalAlign: -2 }} />
          Available ({availableCount})
        </button>

        <button
          type="button"
          className={`dco-tab-btn ${statusFilter === 'BOOKED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('BOOKED')}
          style={{ minHeight: '36px', fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        >
          <XCircleIcon size={13} color={statusFilter === 'BOOKED' ? '#ffffff' : '#ef4444'} style={{ marginRight: 4, verticalAlign: -2 }} />
          Booked
        </button>

        <button
          type="button"
          className={`dco-tab-btn ${statusFilter === 'REQUESTED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('REQUESTED')}
          style={{ minHeight: '36px', fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        >
          <ClockIcon size={13} color={statusFilter === 'REQUESTED' ? '#ffffff' : '#f59e0b'} style={{ marginRight: 4, verticalAlign: -2 }} />
          Requested
        </button>

        <button
          type="button"
          className={`dco-tab-btn ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('CONFIRMED')}
          style={{ minHeight: '36px', fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
        >
          <NavigationIcon size={13} color={statusFilter === 'CONFIRMED' ? '#ffffff' : '#2563eb'} style={{ marginRight: 4, verticalAlign: -2 }} />
          On Duty
        </button>
      </div>

      {/* 4. Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="dco-empty-state">
          <CarIcon size={42} color="#94a3b8" />
          <strong className="dco-empty-title">No vehicles match your filter</strong>
          <p className="dco-empty-desc">
            Try adjusting your search query, status filter, or selected city.
          </p>
        </div>
      ) : (
        <div className="dco-vehicle-grid">
          {displayedVehicles.map((vehicle) => {
            const supplier = suppliers.find((s) => String(s.id) === String(vehicle.supplierId));
            const isAvailable = vehicle.status === 'AVAILABLE';
            const isBooked = vehicle.status === 'BOOKED';
            const isRequested = vehicle.status === 'REQUESTED';
            const isConfirmed = vehicle.status === 'CONFIRMED';

            let cardStatusClass = 'status-available';
            if (isBooked) cardStatusClass = 'status-booked';
            if (isRequested) cardStatusClass = 'status-requested';
            if (isConfirmed) cardStatusClass = 'status-confirmed';

            return (
              <div className={`dco-vehicle-card ${cardStatusClass}`} key={vehicle.id}>
                <div className="dco-vehicle-card-top">
                  <div className="dco-vehicle-info">
                    <div className="plate-badge">
                      <TaxiIcon size={14} color="#000000" />
                      <span>{vehicle.number}</span>
                    </div>
                    <h3 className="dco-vehicle-name">{vehicle.name}</h3>
                    <span className="dco-vehicle-model">{vehicle.model || 'Commercial Taxi'}</span>
                  </div>
                  <StatusBadge status={vehicle.status} />
                </div>

                {!isSupplier && (
                  <div style={{ background: '#f8fafc', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)', display: 'grid', gap: '0.3rem', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <UserIcon size={12} color="#64748b" />
                      <strong style={{ color: 'var(--text-secondary)' }}>{supplier?.fullName || 'Unknown'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>({supplier?.companyName || 'Independent'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPinIcon size={12} color="#64748b" />
                      <span style={{ color: 'var(--text-muted)' }}>{supplier?.city || 'City not set'}</span>
                    </div>
                  </div>
                )}

                {/* Action Controls:
                    Notice: Suppliers CANNOT edit vehicle, only toggle status!
                    Admin CAN edit car and delete car! */}
                <div className="dco-vehicle-actions">
                  {/* Status Toggle (Both Admin and Supplier can toggle availability) */}
                  <Button
                    size="sm"
                    variant={isAvailable ? 'secondary' : 'success'}
                    disabled={isRequested || isConfirmed}
                    onClick={() => handleToggleStatus(vehicle)}
                    style={{ flex: 1, minHeight: '38px' }}
                  >
                    {isAvailable ? 'Mark Booked' : 'Mark Available'}
                  </Button>

                  {/* ONLY ADMIN CAN EDIT VEHICLE */}
                  {!isSupplier && (
                    <Button size="sm" variant="outline" onClick={() => setEditing({ ...vehicle })} style={{ minHeight: '38px' }}>
                      Edit
                    </Button>
                  )}

                  {/* ONLY ADMIN CAN DELETE VEHICLE */}
                  {!isSupplier && (
                    <Button size="sm" variant="danger" onClick={() => removeVehicle(vehicle)} style={{ minHeight: '38px' }}>
                      Delete
                    </Button>
                  )}
                </div>

                {!isSupplier && supplier?.whatsapp && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="admin-whatsapp-btn"
                      style={{ justifyContent: 'center' }}
                    >
                      <WhatsAppIcon size={13} color="#ffffff" />
                      <span>WhatsApp Supplier</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More & Pagination Bar for high fleet volume */}
      {filteredVehicles.length > 0 && (
        <div style={{
          marginTop: '1.25rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            Showing <strong style={{ color: '#0f172a' }}>{displayedVehicles.length}</strong> of{' '}
            <strong style={{ color: '#0f172a' }}>{filteredVehicles.length}</strong> vehicles
            {relevantVehicles.length !== filteredVehicles.length && (
              <span style={{ color: '#94a3b8' }}> (Filtered from {relevantVehicles.length} total)</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {visibleCount < filteredVehicles.length ? (
              <>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 1px 2px rgba(2,132,199,0.2)'
                  }}
                >
                  <span>Load More (+30 Cars)</span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                    {filteredVehicles.length - displayedVehicles.length} left
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredVehicles.length)}
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer'
                  }}
                >
                  Show All ({filteredVehicles.length})
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  ✓ All {filteredVehicles.length} vehicles displayed
                </span>
                {filteredVehicles.length > 30 && (
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(30);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    style={{
                      background: '#f8fafc',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Collapse to 30
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. Edit Modal (ADMIN ONLY) */}
      {!isSupplier && editing && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <section className="edit-modal" role="dialog" aria-modal="true">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Vehicle Registry</span>
                <h2>Edit {editing.name} ({editing.number})</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                <XIcon size={16} />
              </Button>
            </div>
            <form className="supplier-compact-form" onSubmit={saveEdit}>
              <div className="form-group">
                <label className="form-label">Vehicle Category / Group</label>
                <select
                  className="form-input"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                >
                  {groupNames.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <Input
                label="License Plate Number"
                value={editing.number}
                onChange={(e) => setEditing({ ...editing, number: e.target.value })}
                required
              />

              <Input
                label="Car Model / Year / Specs"
                value={editing.model}
                onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                required
              />

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Vehicle Details
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default FleetManagementPage;
