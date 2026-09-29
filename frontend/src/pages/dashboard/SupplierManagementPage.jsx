import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import {
  TaxiIcon,
  CarIcon,
  UsersIcon,
  UserIcon,
  KeyIcon,
  MapPinIcon,
  WhatsAppIcon,
  PlusIcon,
  XIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  CopyIcon,
  MessageSquareIcon,
  SearchIcon,
  SlidersIcon
} from '../../components/common/Icons';

const blankSupplier = { username: '', password: '', fullName: '', companyName: '', whatsapp: '', city: '', vehicleLimit: 5 };
const blankVehicle = { name: '', number: '', model: '', supplierId: '' };

const SupplierManagementPage = () => {
  const {
    suppliers,
    vehicles,
    cities,
    vehicleGroups,
    createSupplier,
    updateSupplier,
    setSupplierStatus,
    deleteSupplier,
    resetSupplierPassword,
    toggleSupplierOnline,
    getVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    setVehicleStatus
  } = useAuth();

  const { showToast } = useToast();

  const cityNames = useMemo(() => {
    return (cities || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
  }, [cities]);

  const groupNames = useMemo(() => {
    return (vehicleGroups || []).map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
  }, [vehicleGroups]);

  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DISABLED' | 'ONLINE' | 'OFFLINE' | 'INACTIVE_2D'
  const [sortBy, setSortBy] = useState('NAME_ASC'); // 'NAME_ASC' | 'NAME_DESC' | 'VEHICLES_DESC' | 'ONLINE_FIRST' | 'RECENT_ACTIVE' | 'QUOTA_DESC'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'TABLE'
  const [visibleCount, setVisibleCount] = useState(24);
  const [search, setSearch] = useState('');

  // Modals & Panels
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState(blankSupplier);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null); // { id, fullName, newPassword: '' }

  // Supplier Vehicle Management View (when clicking supplier card)
  const [managedSupplier, setManagedSupplier] = useState(null); // selected supplier object
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(blankVehicle);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Status Metrics (Precomputed for large scale)
  const activeCount = useMemo(() => suppliers.filter((s) => s.status === 'ACTIVE' || s.active).length, [suppliers]);
  const disabledCount = useMemo(() => suppliers.filter((s) => s.status !== 'ACTIVE' && !s.active).length, [suppliers]);
  const onlineCount = useMemo(() => suppliers.filter((s) => !!s.isOnline).length, [suppliers]);
  const offlineCount = useMemo(() => suppliers.filter((s) => !s.isOnline).length, [suppliers]);
  const inactiveCount = useMemo(() => {
    return suppliers.filter((s) => {
      const lastLogin = s.lastLoginAt ? new Date(s.lastLoginAt) : null;
      let days = s.daysSinceLastLogin;
      if (days == null && lastLogin) {
        days = Math.floor(Math.abs(Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      }
      return !lastLogin || (days != null && days >= 2);
    }).length;
  }, [suppliers]);

  // Reset pagination batch when filters change
  React.useEffect(() => {
    setVisibleCount(24);
  }, [cityFilter, statusFilter, search, sortBy]);

  // High-performance filter & sort (optimized for 100-200+ partners)
  const filteredAndSortedSuppliers = useMemo(() => {
    let result = suppliers.filter((s) => {
      // City filter
      if (cityFilter !== 'ALL' && (s.city || '').toLowerCase() !== cityFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && (s.status !== 'ACTIVE' && !s.active)) return false;
      if (statusFilter === 'DISABLED' && (s.status === 'ACTIVE' || s.active)) return false;
      if (statusFilter === 'ONLINE' && !s.isOnline) return false;
      if (statusFilter === 'OFFLINE' && s.isOnline) return false;
      if (statusFilter === 'INACTIVE_2D') {
        const lastLogin = s.lastLoginAt ? new Date(s.lastLoginAt) : null;
        let days = s.daysSinceLastLogin;
        if (days == null && lastLogin) {
          days = Math.floor(Math.abs(Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        }
        if (!lastLogin || (days != null && days < 2)) return false;
      }

      // Search query across name, company, username, whatsapp, mobile, city
      const q = search.trim().toLowerCase();
      if (q) {
        const match = `${s.fullName || ''} ${s.companyName || ''} ${s.username || ''} ${s.whatsapp || ''} ${s.mobile || ''} ${s.city || ''}`
          .toLowerCase()
          .includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        return (a.fullName || '').localeCompare(b.fullName || '');
      }
      if (sortBy === 'NAME_DESC') {
        return (b.fullName || '').localeCompare(a.fullName || '');
      }
      if (sortBy === 'VEHICLES_DESC') {
        const aCount = vehicles.filter((v) => String(v.supplierId) === String(a.id)).length;
        const bCount = vehicles.filter((v) => String(v.supplierId) === String(b.id)).length;
        return bCount - aCount;
      }
      if (sortBy === 'ONLINE_FIRST') {
        if (a.isOnline === b.isOnline) return (a.fullName || '').localeCompare(b.fullName || '');
        return a.isOnline ? -1 : 1;
      }
      if (sortBy === 'QUOTA_DESC') {
        return (b.vehicleLimit || 5) - (a.vehicleLimit || 5);
      }
      if (sortBy === 'RECENT_ACTIVE') {
        const timeA = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const timeB = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });

    return result;
  }, [suppliers, vehicles, cityFilter, statusFilter, search, sortBy]);

  // Sliced view for DOM performance (Load More mechanism)
  const displayedSuppliers = useMemo(() => {
    return filteredAndSortedSuppliers.slice(0, visibleCount);
  }, [filteredAndSortedSuppliers, visibleCount]);

  const filteredSuppliers = filteredAndSortedSuppliers;

  // Current managed supplier's live vehicles
  const currentSupplierVehicles = useMemo(() => {
    if (!managedSupplier) return [];
    return vehicles.filter((v) => String(v.supplierId) === String(managedSupplier.id));
  }, [managedSupplier, vehicles]);

  // Handle Create Supplier
  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    const res = await createSupplier(supplierForm);
    if (res.success) {
      showToast(`Supplier account created for ${supplierForm.fullName}`, 'success');
      setSupplierForm(blankSupplier);
      setAddSupplierOpen(false);
    } else {
      showToast(res.message || 'Failed to create supplier', 'error');
    }
  };

  // Handle Edit Supplier
  const handleSaveSupplierEdit = async (e) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const payload = {
      fullName: editingSupplier.fullName?.trim(),
      companyName: editingSupplier.companyName?.trim(),
      city: editingSupplier.city?.trim(),
      whatsapp: editingSupplier.whatsapp?.trim(),
      email: editingSupplier.email?.trim() || null,
      mobile: editingSupplier.mobile?.trim() || null,
      username: editingSupplier.username?.trim().toLowerCase(),
      status: editingSupplier.status || 'ACTIVE',
      vehicleLimit: Number(editingSupplier.vehicleLimit) || 5
    };
    if (editingSupplier.newPassword && editingSupplier.newPassword.trim().length >= 6) {
      payload.newPassword = editingSupplier.newPassword.trim();
    }

    const res = await updateSupplier(editingSupplier.id, payload);
    if (res.success) {
      showToast('Supplier details and quota updated successfully', 'success');
      if (managedSupplier && managedSupplier.id === editingSupplier.id) {
        setManagedSupplier((prev) => ({ ...prev, ...payload }));
      }
      setEditingSupplier(null);
    } else {
      showToast(res.message || 'Failed to update supplier', 'error');
    }
  };

  // Handle Reset Supplier Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordModal?.newPassword || passwordModal.newPassword.trim().length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    const res = await resetSupplierPassword(passwordModal.id, passwordModal.newPassword.trim());
    if (res.success) {
      showToast(`Password reset successfully for ${passwordModal.fullName}`, 'success');
      setPasswordModal(null);
    } else {
      showToast(res.message || 'Failed to reset password', 'error');
    }
  };

  // Handle Toggle Supplier Status
  const handleToggleSupplierStatus = async (supplier, e) => {
    if (e) e.stopPropagation();
    const nextStatus = !supplier.active && supplier.status !== 'ACTIVE';
    const res = await setSupplierStatus(supplier.id, nextStatus);
    if (res.success) {
      showToast(`${supplier.fullName} account ${nextStatus ? 'activated' : 'disabled'}`, 'info');
    } else {
      showToast(res.message || 'Failed to update status', 'error');
    }
  };

  // Handle Delete Supplier
  const handleDeleteSupplier = async (supplier, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete supplier ${supplier.fullName} and all their registered vehicles?`)) {
      const res = await deleteSupplier(supplier.id);
      if (res.success) {
        showToast(`Supplier ${supplier.fullName} deleted`, 'info');
        if (managedSupplier?.id === supplier.id) {
          setManagedSupplier(null);
        }
      } else {
        showToast(res.message || 'Failed to delete supplier', 'error');
      }
    }
  };

  // ── VEHICLE ACTIONS FOR MANAGED SUPPLIER ──
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!managedSupplier) return;

    const groupToUse = vehicleForm.name || groupNames[0] || 'Dzire';
    const res = await createVehicle({
      name: groupToUse,
      number: vehicleForm.number,
      model: vehicleForm.model || groupToUse,
      supplierId: managedSupplier.id
    });

    if (res.success) {
      showToast(`Vehicle ${vehicleForm.number.toUpperCase()} added to ${managedSupplier.fullName}`, 'success');
      setVehicleForm(blankVehicle);
      setAddVehicleOpen(false);
    } else {
      showToast(res.message || 'Failed to add vehicle', 'error');
    }
  };

  const handleSaveVehicleEdit = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const res = await updateVehicle(editingVehicle.id, editingVehicle);
    if (res.success) {
      showToast(`Vehicle ${editingVehicle.number} updated successfully`, 'success');
      setEditingVehicle(null);
    } else {
      showToast(res.message || 'Failed to update vehicle', 'error');
    }
  };

  const handleDeleteVehicle = async (vehicleId, plate) => {
    if (window.confirm(`Delete vehicle ${plate}?`)) {
      const res = await deleteVehicle(vehicleId);
      if (res.success) {
        showToast(`Vehicle ${plate} removed`, 'info');
      } else {
        showToast(res.message || 'Failed to delete vehicle', 'error');
      }
    }
  };

  const handleToggleVehicleStatus = async (vehicle) => {
    const nextStatus = vehicle.status === 'AVAILABLE' ? 'BOOKED' : 'AVAILABLE';
    const res = await setVehicleStatus(vehicle.id, nextStatus);
    if (res.success) {
      showToast(`${vehicle.number} marked as ${nextStatus}`, 'info');
    }
  };

  return (
    <div className="admin-container">
      {/* 1. Header Bar */}
      <div className="admin-hero-card">
        <div className="admin-hero-copy">
          <div className="admin-live-badge">
            <span className="admin-pulse-dot" />
            <span>FLEET PARTNERS ({suppliers.length})</span>
          </div>
          <h1>Supplier Management</h1>
          <p>Supervise supplier cards, configure vehicle addition limits, and manage their assigned vehicles live.</p>
        </div>
        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-hero-btn primary"
            onClick={() => setAddSupplierOpen(!addSupplierOpen)}
          >
            <PlusIcon size={16} />
            <span>{addSupplierOpen ? 'Close Form' : 'Register New Supplier'}</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Register Supplier Form */}
      {addSupplierOpen && (
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
                Add New Supplier Partner
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAddSupplierOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <XIcon size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateSupplier} className="dense-form">
            <Input
              label="Supplier / Contact Person *"
              name="fullName"
              value={supplierForm.fullName}
              onChange={(e) => setSupplierForm({ ...supplierForm, fullName: e.target.value })}
              required
              placeholder="e.g. Jaswinder Singh"
            />
            <Input
              label="Fleet / Company Name *"
              name="companyName"
              value={supplierForm.companyName}
              onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
              required
              placeholder="e.g. Khalsa Tour & Travels"
            />
            <div className="form-group">
              <label className="form-label">Operating City *</label>
              <select
                className="form-input"
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                required
              >
                <option value="">Select Operational City</option>
                {cityNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Input
              label="WhatsApp Phone Number *"
              name="whatsapp"
              value={supplierForm.whatsapp}
              onChange={(e) => setSupplierForm({ ...supplierForm, whatsapp: e.target.value })}
              required
              placeholder="e.g. 919876543210"
            />
            <Input
              label="Portal Username *"
              name="username"
              value={supplierForm.username}
              onChange={(e) => setSupplierForm({ ...supplierForm, username: e.target.value })}
              required
              autoComplete="off"
              placeholder="e.g. khalsa_cabs"
            />
            <Input
              label="Initial Password *"
              name="password"
              type="password"
              value={supplierForm.password}
              onChange={(e) => setSupplierForm({ ...supplierForm, password: e.target.value })}
              required
              autoComplete="new-password"
              placeholder="Min 6 characters"
            />
            <div className="form-group">
              <label className="form-label">Max Allowed Vehicles (Quota) *</label>
              <input
                type="number"
                min="1"
                max="100"
                className="form-input"
                value={supplierForm.vehicleLimit}
                onChange={(e) => setSupplierForm({ ...supplierForm, vehicleLimit: e.target.value })}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Maximum number of vehicles this supplier is allowed to register.
              </span>
            </div>

            <div className="full-span" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <Button type="button" variant="outline" onClick={() => setAddSupplierOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create Supplier Account
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* 3. High-Performance Multi-Filter Toolbar for 100-200+ Suppliers */}
      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {/* Row 1: Search, Sort Dropdown, and View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SearchIcon size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partner, company, mobile, city..."
              style={{ height: '38px', paddingLeft: '34px', paddingRight: search ? '32px' : '10px', fontSize: '0.85rem' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <SlidersIcon size={14} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                height: '38px',
                padding: '0 0.65rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.825rem',
                color: '#1e293b',
                background: '#ffffff',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <option value="NAME_ASC">Name (A → Z)</option>
              <option value="NAME_DESC">Name (Z → A)</option>
              <option value="ONLINE_FIRST">🟢 Online First</option>
              <option value="VEHICLES_DESC">🚗 Most Vehicles</option>
              <option value="RECENT_ACTIVE">🕒 Recently Active</option>
              <option value="QUOTA_DESC">📈 Highest Quota</option>
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              style={{
                background: viewMode === 'CARDS' ? '#ffffff' : 'transparent',
                color: viewMode === 'CARDS' ? '#0f172a' : '#64748b',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'CARDS' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🗂️ Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              style={{
                background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#0f172a' : '#64748b',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: viewMode === 'TABLE' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📋 Table List
            </button>
          </div>
        </div>

        {/* Row 2: Status Filter Tabs with Counts */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
          {[
            { id: 'ALL', label: 'All Partners', count: suppliers.length },
            { id: 'ACTIVE', label: 'Active', count: activeCount },
            { id: 'DISABLED', label: 'Disabled', count: disabledCount },
            { id: 'ONLINE', label: '🟢 Online Now', count: onlineCount },
            { id: 'OFFLINE', label: '⚪ Offline', count: offlineCount },
            { id: 'INACTIVE_2D', label: '⚠️ Inactive >2d', count: inactiveCount }
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  background: isSelected ? '#0284c7' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.785rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#475569',
                    padding: '0.05rem 0.4rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: City Filter Chips */}
        <div className="filter-chips-scroll" style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <button
            type="button"
            className={`filter-chip ${cityFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setCityFilter('ALL')}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            All Cities ({suppliers.length})
          </button>
          {cityNames.map((c) => {
            const count = suppliers.filter((s) => (s.city || '').toLowerCase() === c.toLowerCase()).length;
            if (count === 0) return null;
            return (
              <button
                type="button"
                key={c}
                className={`filter-chip ${cityFilter.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                onClick={() => setCityFilter(c)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Supplier List / Grid View (Scalable to 100-200+ partners) */}
      {filteredAndSortedSuppliers.length === 0 ? (
        <div className="dco-empty-state">
          <UsersIcon size={42} color="#94a3b8" />
          <strong className="dco-empty-title">No suppliers found</strong>
          <p className="dco-empty-desc">
            No supplier accounts match your filters or search query. Use the button above to register a new supplier.
          </p>
        </div>
      ) : viewMode === 'TABLE' ? (
        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Partner / Company</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location & Phone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Portal Status</th>
                  <th style={{ padding: '0.75rem 1rem', minWidth: '160px' }}>Vehicle Quota</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedSuppliers.map((supplier) => {
                  const supplierCars = getVehicles(supplier.id);
                  const carCount = supplierCars.length;
                  const readyCars = supplierCars.filter((c) => c.status === 'AVAILABLE').length;
                  const quota = supplier.vehicleLimit || 5;
                  const quotaPercent = Math.min(100, Math.round((carCount / quota) * 100));
                  const isActive = supplier.status === 'ACTIVE' || supplier.active;
                  const isOnline = !!supplier.isOnline;
                  const lastLogin = supplier.lastLoginAt ? new Date(supplier.lastLoginAt) : null;
                  let daysInactive = supplier.daysSinceLastLogin != null ? supplier.daysSinceLastLogin : null;
                  if (daysInactive == null && lastLogin) {
                    const diffTime = Math.abs(new Date().getTime() - lastLogin.getTime());
                    daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  }
                  let loginTimeText = 'Never logged in';
                  if (lastLogin) {
                    const isToday = new Date().toDateString() === lastLogin.toDateString();
                    const timeStr = lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    loginTimeText = isToday ? `Today ${timeStr}` : `${lastLogin.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
                  }

                  return (
                    <tr
                      key={supplier.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span
                            style={{
                              width: 9,
                              height: 9,
                              borderRadius: '50%',
                              background: isOnline ? '#10b981' : '#cbd5e1',
                              boxShadow: isOnline ? '0 0 0 2px rgba(16,185,129,0.2)' : 'none',
                              flexShrink: 0
                            }}
                            title={isOnline ? 'Online now' : 'Offline'}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                              {supplier.fullName || 'Unnamed'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {supplier.companyName ? `${supplier.companyName} · ` : ''}@{supplier.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'inline-block', padding: '0.15rem 0.45rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                          {supplier.city || 'No City'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {supplier.whatsapp || supplier.mobile || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.725rem', padding: '0.12rem 0.45rem', borderRadius: '999px', fontWeight: 700, background: isActive ? '#ecfdf5' : '#fef2f2', color: isActive ? '#059669' : '#dc2626' }}>
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                          <span style={{ fontSize: '0.725rem', fontWeight: 600, color: isOnline ? '#059669' : '#94a3b8' }}>
                            {isOnline ? '🟢 Online' : '⚪ Offline'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {loginTimeText}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                          <span style={{ color: carCount >= quota ? '#dc2626' : '#1e293b' }}>
                            {carCount} / {quota} cars
                          </span>
                          <span style={{ color: readyCars > 0 ? '#10b981' : '#64748b' }}>
                            {readyCars} ready
                          </span>
                        </div>
                        <div className="quota-bar-track" style={{ height: '5px' }}>
                          <div
                            className={`quota-bar-fill ${carCount >= quota ? 'full' : carCount >= quota * 0.8 ? 'warning' : 'normal'}`}
                            style={{ width: `${quotaPercent}%`, height: '5px' }}
                          />
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => { setManagedSupplier(supplier); setAddVehicleOpen(false); }}
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '0.3rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <TaxiIcon size={13} />
                            <span>Fleet ({carCount})</span>
                          </button>

                          {supplier.whatsapp && (
                            <a
                              href={`https://wa.me/${supplier.whatsapp.replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              style={{
                                background: '#25d366',
                                color: '#ffffff',
                                padding: '0.3rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title="Chat on WhatsApp"
                            >
                              <WhatsAppIcon size={12} color="#ffffff" />
                            </a>
                          )}

                          <button
                            type="button"
                            className="admin-card-btn edit"
                            onClick={() => setEditingSupplier({ ...supplier })}
                            title="Edit & Quota"
                            style={{ padding: '0.3rem 0.45rem' }}
                          >
                            <EditIcon size={12} />
                          </button>

                          <button
                            type="button"
                            className="admin-card-btn key"
                            onClick={() => setPasswordModal({ id: supplier.id, fullName: supplier.fullName, newPassword: '' })}
                            title="Reset Password"
                            style={{ padding: '0.3rem 0.45rem' }}
                          >
                            <KeyIcon size={12} />
                          </button>

                          <button
                            type="button"
                            className={`admin-card-btn ${isActive ? 'disable' : 'enable'}`}
                            onClick={(e) => handleToggleSupplierStatus(supplier, e)}
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          >
                            {isActive ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            type="button"
                            className="admin-card-btn delete"
                            onClick={(e) => handleDeleteSupplier(supplier, e)}
                            title="Delete Supplier"
                            style={{ padding: '0.3rem 0.45rem' }}
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="supplier-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '0.85rem'
          }}
        >
          {displayedSuppliers.map((supplier) => {
            const supplierCars = getVehicles(supplier.id);
            const carCount = supplierCars.length;
            const readyCars = supplierCars.filter((c) => c.status === 'AVAILABLE').length;
            const bookedCars = supplierCars.filter((c) => c.status !== 'AVAILABLE').length;
            const quota = supplier.vehicleLimit || 5;
            const quotaPercent = Math.min(100, Math.round((carCount / quota) * 100));
            const isActive = supplier.status === 'ACTIVE' || supplier.active;

            const isOnline = !!supplier.isOnline;
            const lastLogin = supplier.lastLoginAt ? new Date(supplier.lastLoginAt) : null;
            let daysInactive = supplier.daysSinceLastLogin != null ? supplier.daysSinceLastLogin : null;
            if (daysInactive == null && lastLogin) {
              const diffTime = Math.abs(new Date().getTime() - lastLogin.getTime());
              daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            const isInactive = !lastLogin || (daysInactive != null && daysInactive >= 2);
            let loginTimeText = 'Never logged in';
            if (lastLogin) {
              const isToday = new Date().toDateString() === lastLogin.toDateString();
              const timeStr = lastLogin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              loginTimeText = isToday ? `Today ${timeStr}` : `${lastLogin.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
            }

            return (
              <div
                key={supplier.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Top: Avatar, Name, Company, Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isOnline
                          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}
                    >
                      {(supplier.fullName || supplier.username || 'S').charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`supplier-online-dot ${isOnline ? 'online' : 'offline'}`}
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        border: '2px solid #ffffff'
                      }}
                      title={isOnline ? 'Online (Logged In)' : 'Offline'}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          margin: 0,
                          color: 'var(--color-dark, #0f172a)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {supplier.fullName}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const res = await toggleSupplierOnline(supplier.id);
                            if (res.success) {
                              showToast(`${supplier.fullName} online status updated live.`, 'info');
                            }
                          }}
                          className={`supplier-online-badge ${isOnline ? 'online' : 'offline'}`}
                          style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', border: 'none', cursor: 'pointer' }}
                          title="Click to toggle online/offline status live"
                        >
                          <span className={`supplier-online-dot ${isOnline ? 'online' : 'offline'}`} style={{ width: 6, height: 6 }} />
                          <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </button>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.4rem',
                            borderRadius: '4px',
                            background: isActive ? '#dcfce7' : '#fee2e2',
                            color: isActive ? '#15803d' : '#b91c1c'
                          }}
                        >
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                        {supplier.companyName || 'Fleet Operator'}
                      </span>
                      {/* Live Ready vs Booked pill */}
                      <span style={{ fontSize: '0.7rem', display: 'inline-flex', gap: '0.4rem', fontWeight: 600 }}>
                        <span style={{ color: '#16a34a' }}>● {readyCars} Ready</span>
                        <span style={{ color: '#dc2626' }}>● {bookedCars} Booked</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          background: '#eff6ff',
                          color: '#1e40af',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <MapPinIcon size={11} />
                        {supplier.city || 'No City'}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                        @{supplier.username}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.3rem', flexWrap: 'wrap', fontSize: '0.725rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <ClockIcon size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Login: <strong>{loginTimeText}</strong>
                      </span>
                      {isInactive && (
                        <span className="supplier-inactive-tag" style={{ fontSize: '0.68rem', padding: '0.08rem 0.35rem' }}>
                          <AlertTriangleIcon size={10} />
                          <span>{daysInactive >= 999 ? 'Never In' : `${daysInactive}d Inactive`}</span>
                        </span>
                      )}
                      {!isInactive && !isOnline && daysInactive === 0 && (
                        <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', padding: '0.08rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                          Active Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quota Progress Bar: "how much every supper can add vehicle and show" */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.775rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Vehicle Quota:</span>
                    <span style={{ fontWeight: 700, color: carCount >= quota ? '#dc2626' : '#1e293b' }}>
                      {carCount} / {quota} cars ({quotaPercent}%)
                    </span>
                  </div>

                  <div className="quota-bar-track">
                    <div
                      className={`quota-bar-fill ${carCount >= quota ? 'full' : carCount >= quota * 0.8 ? 'warning' : 'normal'}`}
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                </div>

                {/* Primary Card Action: "when we click on that we can see its vehicle and manage its vehicle" */}
                <button
                  type="button"
                  onClick={() => {
                    setManagedSupplier(supplier);
                    setAddVehicleOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    padding: '0.6rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dbeafe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                >
                  <TaxiIcon size={16} />
                  <span>View & Manage Fleet ({carCount} cars)</span>
                </button>

                {/* Secondary Quick Actions */}
                <div className="supplier-card-actions">
                  {supplier.whatsapp && (
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      style={{
                        background: '#25d366',
                        color: '#ffffff',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <WhatsAppIcon size={13} color="#ffffff" />
                      <span>Chat</span>
                    </a>
                  )}

                  {supplier.whatsapp && !isOnline && (
                    <a
                      href={`https://wa.me/${supplier.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hello ${supplier.fullName || 'Partner'}, please log in to your Fleetza Supplier Portal (${window.location.origin}/login) to view active duty dispatches. - Fleetza Operations`)}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Send 'Please login' reminder via WhatsApp"
                    >
                      <MessageSquareIcon size={12} />
                      <span>Remind Login</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="admin-card-btn edit"
                    onClick={() => setEditingSupplier({ ...supplier })}
                  >
                    <EditIcon size={12} />
                    <span>Edit & Quota</span>
                  </button>

                  <button
                    type="button"
                    className="admin-card-btn key"
                    onClick={() => setPasswordModal({ id: supplier.id, fullName: supplier.fullName, newPassword: '' })}
                    title="Reset Password"
                  >
                    <KeyIcon size={12} />
                    <span>Pass</span>
                  </button>

                  <button
                    type="button"
                    className={`admin-card-btn ${isActive ? 'disable' : 'enable'}`}
                    onClick={(e) => handleToggleSupplierStatus(supplier, e)}
                  >
                    <span>{isActive ? 'Disable' : 'Enable'}</span>
                  </button>

                  <button
                    type="button"
                    className="admin-card-btn delete"
                    onClick={(e) => handleDeleteSupplier(supplier, e)}
                    title="Delete Supplier"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Load More & Pagination Controls for High-Volume (100-200+) Partners */}
      {filteredAndSortedSuppliers.length > 0 && (
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
            Showing <strong style={{ color: '#0f172a' }}>{displayedSuppliers.length}</strong> of{' '}
            <strong style={{ color: '#0f172a' }}>{filteredAndSortedSuppliers.length}</strong> partners
            {suppliers.length !== filteredAndSortedSuppliers.length && (
              <span style={{ color: '#94a3b8' }}> (Filtered from {suppliers.length} total)</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {visibleCount < filteredAndSortedSuppliers.length ? (
              <>
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 24)}
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
                  <span>Load More (+24 Partners)</span>
                  <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                    {filteredAndSortedSuppliers.length - displayedSuppliers.length} left
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredAndSortedSuppliers.length)}
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
                  Show All ({filteredAndSortedSuppliers.length})
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                  ✓ All {filteredAndSortedSuppliers.length} partners loaded
                </span>
                {filteredAndSortedSuppliers.length > 24 && (
                  <button
                    type="button"
                    onClick={() => {
                      setVisibleCount(24);
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
                    Collapse to Top 24
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. DEDICATED MODAL: VIEW & MANAGE SUPPLIER VEHICLES */}
      {managedSupplier && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setManagedSupplier(null);
          }}
        >
          <div
            className="edit-modal"
            style={{ maxWidth: '640px', width: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="panel-heading" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span className="eyebrow" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                  Supplier Fleet Management
                </span>
                <h2 style={{ fontSize: '1.25rem', margin: '0.2rem 0', color: 'var(--color-dark)' }}>
                  {managedSupplier.fullName} · {managedSupplier.companyName}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>{managedSupplier.city}</span>
                  <span>·</span>
                  <span>
                    Used: <strong>{currentSupplierVehicles.length}</strong> / <strong>{managedSupplier.vehicleLimit || 5}</strong> cars
                  </span>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4, marginLeft: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Limit:</span>
                    <button
                      type="button"
                      style={{ padding: '0.05rem 0.35rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 3, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                      title="Decrease quota limit"
                      onClick={async () => {
                        const newLimit = Math.max(1, (managedSupplier.vehicleLimit || 5) - 1);
                        await updateSupplier(managedSupplier.id, { vehicleLimit: newLimit });
                        setManagedSupplier((prev) => ({ ...prev, vehicleLimit: newLimit }));
                        showToast(`Vehicle quota updated to ${newLimit} cars`, 'info');
                      }}
                    >
                      -
                    </button>
                    <strong style={{ fontSize: '0.8rem', minWidth: '16px', textAlign: 'center' }}>
                      {managedSupplier.vehicleLimit || 5}
                    </strong>
                    <button
                      type="button"
                      style={{ padding: '0.05rem 0.35rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 3, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                      title="Increase quota limit"
                      onClick={async () => {
                        const newLimit = (managedSupplier.vehicleLimit || 5) + 1;
                        await updateSupplier(managedSupplier.id, { vehicleLimit: newLimit });
                        setManagedSupplier((prev) => ({ ...prev, vehicleLimit: newLimit }));
                        showToast(`Vehicle quota increased to ${newLimit} cars`, 'success');
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagedSupplier(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Modal Body: Vehicle List & Add Vehicle */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Add Vehicle Toggle Button - Always allowed for Admin */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-dark)' }}>
                  Assigned Vehicles ({currentSupplierVehicles.length})
                </strong>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setVehicleForm({ ...blankVehicle, name: groupNames[0] || 'Dzire', supplierId: managedSupplier.id });
                    setAddVehicleOpen(!addVehicleOpen);
                  }}
                >
                  <PlusIcon size={14} />
                  <span>{addVehicleOpen ? 'Cancel' : '+ Add Vehicle'}</span>
                </Button>
              </div>

              {/* Add Vehicle Form for this Supplier */}
              {addVehicleOpen && (
                <form
                  onSubmit={handleAddVehicle}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                    Register Vehicle for {managedSupplier.fullName}
                  </strong>

                  <div className="form-group">
                    <label className="form-label">Vehicle Group / Category *</label>
                    <select
                      className="form-input"
                      value={vehicleForm.name}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                      required
                    >
                      {groupNames.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="License Plate Number *"
                    value={vehicleForm.number}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, number: e.target.value })}
                    placeholder="e.g. PB01XY1234"
                    required
                  />

                  <Input
                    label="Vehicle Model / Year / Color *"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    placeholder="e.g. 2024 White Sedan AC"
                    required
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Button type="button" size="sm" variant="outline" onClick={() => setAddVehicleOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" variant="primary">
                      Save & Register Car
                    </Button>
                  </div>
                </form>
              )}

              {/* Edit Vehicle Form if editing */}
              {editingVehicle && (
                <form
                  onSubmit={handleSaveVehicleEdit}
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: '#b45309' }}>
                      Edit Vehicle: {editingVehicle.number}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setEditingVehicle(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e' }}
                    >
                      <XIcon size={16} />
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Group *</label>
                    <select
                      className="form-input"
                      value={editingVehicle.name}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                      required
                    >
                      {groupNames.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="License Plate Number *"
                    value={editingVehicle.number}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, number: e.target.value })}
                    required
                  />

                  <Input
                    label="Model / Description *"
                    value={editingVehicle.model}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                    required
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingVehicle(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" variant="primary">
                      Update Vehicle
                    </Button>
                  </div>
                </form>
              )}

              {/* List of Cars */}
              {currentSupplierVehicles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <TaxiIcon size={36} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No vehicles registered yet.</p>
                  <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                    Use the "Add Vehicle" button above to register cars for this supplier.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentSupplierVehicles.map((car) => {
                    const isAvailable = car.status === 'AVAILABLE';

                    return (
                      <div
                        key={car.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              background: '#fbbf24',
                              color: '#000000',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              letterSpacing: '0.04em'
                            }}
                          >
                            {car.number}
                          </span>
                          <div>
                            <strong style={{ fontSize: '0.875rem', color: 'var(--color-dark)' }}>
                              {car.name}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                              ({car.model || car.name})
                            </span>
                          </div>
                        </div>

                        {/* Status badge & Management buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={`btn-status-toggle ${isAvailable ? 'available' : 'booked'}`}
                            onClick={() => handleToggleVehicleStatus(car)}
                            title="Click to toggle status"
                          >
                            <span>{isAvailable ? '● AVAILABLE' : '● BOOKED'}</span>
                          </button>

                          <button
                            type="button"
                            className="admin-card-btn edit"
                            onClick={() => setEditingVehicle({ ...car })}
                            title="Edit Vehicle"
                          >
                            <EditIcon size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="admin-card-btn delete"
                            onClick={() => handleDeleteVehicle(car.id, car.number)}
                            title="Delete Vehicle"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setManagedSupplier(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. EDIT SUPPLIER & QUOTA MODAL */}
      {editingSupplier && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingSupplier(null);
          }}
        >
          <section className="edit-modal" role="dialog" aria-modal="true" style={{ maxWidth: '480px' }}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Supplier Profile & Quota</span>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Edit {editingSupplier.fullName}</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditingSupplier(null)}>
                <XIcon size={16} />
              </Button>
            </div>

            <form onSubmit={handleSaveSupplierEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem', maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              <Input
                label="Supplier / Contact Person *"
                value={editingSupplier.fullName || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, fullName: e.target.value })}
                required
              />
              <Input
                label="Company / Fleet Name *"
                value={editingSupplier.companyName || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, companyName: e.target.value })}
                required
              />
              <div className="form-group">
                <label className="form-label">Operating City *</label>
                <select
                  className="form-input"
                  value={editingSupplier.city || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, city: e.target.value })}
                  required
                >
                  <option value="">Select Operational City</option>
                  {cityNames.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Input
                label="WhatsApp Phone Number *"
                value={editingSupplier.whatsapp || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, whatsapp: e.target.value })}
                required
                placeholder="e.g. +919814012345"
              />
              <Input
                label="Mobile Contact Number"
                value={editingSupplier.mobile || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, mobile: e.target.value })}
                placeholder="e.g. 9814012345"
              />
              <Input
                label="Email Address"
                type="email"
                value={editingSupplier.email || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                placeholder="e.g. partner@example.com"
              />
              <Input
                label="Portal Username *"
                value={editingSupplier.username || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, username: e.target.value })}
                required
                placeholder="e.g. supplier_username"
              />
              <div className="form-group">
                <label className="form-label">Account Status *</label>
                <select
                  className="form-input"
                  value={editingSupplier.status || (editingSupplier.active ? 'ACTIVE' : 'INACTIVE')}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, status: e.target.value })}
                  required
                >
                  <option value="ACTIVE">ACTIVE (Enabled & Active)</option>
                  <option value="INACTIVE">INACTIVE (Disabled)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
              <Input
                label="Set New Password (Optional)"
                type="password"
                value={editingSupplier.newPassword || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, newPassword: e.target.value })}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
              />
              <div className="form-group">
                <label className="form-label">Maximum Vehicle Quota (Cars Allowed) *</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  className="form-input"
                  value={editingSupplier.vehicleLimit || 5}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, vehicleLimit: Number(e.target.value) })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Admin control: Limit how many vehicles this supplier can register.
                </span>
              </div>

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* 7. RESET PASSWORD MODAL */}
      {passwordModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPasswordModal(null);
          }}
        >
          <section className="edit-modal" role="dialog" aria-modal="true" style={{ maxWidth: '420px' }}>
            <div className="panel-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyIcon size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Reset Password</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setPasswordModal(null)}>
                <XIcon size={16} />
              </Button>
            </div>

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Set a new login password for <strong>{passwordModal.fullName}</strong>.
            </p>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
              <Input
                label="New Password (Min 6 Characters) *"
                type="password"
                value={passwordModal.newPassword}
                onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
                autoComplete="new-password"
              />

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setPasswordModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Set New Password
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default SupplierManagementPage;
