import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api/authApi';
import { isServerUnavailableError, SERVER_UNAVAILABLE_MESSAGE } from '../api/axiosClient';
import { supplierApi } from '../api/supplierApi';
import { vehicleApi } from '../api/vehicleApi';
import { bookingApi } from '../api/bookingApi';
import { notificationApi } from '../api/notificationApi';
import { cityApi, DEFAULT_CITIES } from '../api/cityApi';
import { vehicleGroupApi, DEFAULT_VEHICLE_GROUPS } from '../api/vehicleGroupApi';
import {
  requestNotificationPermission,
  showDutySystemNotification,
  stopNotificationSound,
  playNotificationChime,
  playSupplierDutyChime
} from '../utils/notificationSound';

const AuthContext = createContext(null);
const TOKEN_KEY = 'fleetza_token';
const USER_KEY = 'fleetza_user';

export const SUPPLIER_CITIES = DEFAULT_CITIES;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Live state synchronized with backend
  const [cities, setCities] = useState(DEFAULT_CITIES.map((name, i) => ({ id: i + 1, name })));
  const [vehicleGroups, setVehicleGroups] = useState(DEFAULT_VEHICLE_GROUPS.map((name, i) => ({ id: i + 1, name })));
  const [suppliers, setSuppliers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const userRef = useRef(user);
  userRef.current = user;
  const previousNotifIdsRef = useRef(null);

  const refreshAllData = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;

    try {
      const currentUser = userRef.current;
      const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');
      const isSupplier = currentUser?.roles?.includes('ROLE_SUPPLIER');

      // 0. Live User Profile Sync (Updates quota, company name, city, and status if Admin modified them)
      if (currentUser?.id) {
        try {
          const meRes = await authApi.getCurrentUser();
          if (meRes.success && meRes.data) {
            setUser((prev) => {
              const merged = { ...prev, ...meRes.data };
              localStorage.setItem(USER_KEY, JSON.stringify(merged));
              userRef.current = merged;
              return merged;
            });
          }
        } catch (err) {
          if (err.response?.status === 401) {
            logout();
            return;
          }
        }
      }

      // 1. Notifications
      if (currentUser?.id) {
        try {
          const notifRes = await notificationApi.getNotifications(currentUser.id);
          if (notifRes.success && Array.isArray(notifRes.data)) {
            const newNotifs = notifRes.data;
            if (previousNotifIdsRef.current !== null) {
              const hasNewGeneral = newNotifs.some(
                (n) => !n.read && !previousNotifIdsRef.current.has(n.id) && n.type !== 'BOOKING_REQUEST'
              );
              if (hasNewGeneral) {
                playNotificationChime();
              }
            }
            previousNotifIdsRef.current = new Set(newNotifs.map((n) => n.id));
            setNotifications(newNotifs);
          }
        } catch {}
      }

      // 2. Vehicles
      try {
        const vehicleRes = await vehicleApi.getVehicles(isSupplier && !isAdmin ? currentUser?.id : undefined);
        if (vehicleRes.success && Array.isArray(vehicleRes.data)) {
          setVehicles(vehicleRes.data);
        }
      } catch {}

      // 3. Booking requests
      try {
        const bookingRes = await bookingApi.getBookings(isSupplier && !isAdmin ? currentUser?.id : undefined);
        if (bookingRes.success && Array.isArray(bookingRes.data)) {
          setBookingRequests(bookingRes.data);
          if (isSupplier && currentUser?.id) {
            const pending = bookingRes.data.filter(
              (r) => String(r.supplierId) === String(currentUser.id) && r.status === 'REQUESTED'
            );
            if (pending.length > 0) {
              const latest = pending[0];
              showDutySystemNotification({
                dutyType: latest.dutyType,
                pickupDate: latest.pickupDate,
                pickupTime: latest.pickupTime,
                vehicleNumber: latest.vehicleNumber
              });
            }
          }
        }
      } catch {}

      // 4. Suppliers (both Admin & Supplier so quotas & partner profiles stay live)
      try {
        const suppRes = await supplierApi.getSuppliers();
        if (suppRes.success && Array.isArray(suppRes.data)) {
          setSuppliers(suppRes.data);
        }
      } catch {}

      // 5. Operating cities
      try {
        const cityRes = await cityApi.getCities();
        if (cityRes.success && Array.isArray(cityRes.data)) {
          setCities(cityRes.data);
        }
      } catch {}

      // 6. Vehicle groups
      try {
        const groupRes = await vehicleGroupApi.getVehicleGroups();
        if (groupRes.success && Array.isArray(groupRes.data)) {
          setVehicleGroups(groupRes.data);
        }
      } catch {}
    } catch (error) {
      console.error('Error refreshing live data:', error);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.username === 'admin' || parsedUser.roles?.includes('ROLE_ADMIN') || parsedUser.roles?.includes('ADMIN')) {
            parsedUser.whatsapp = '+918264083932';
            parsedUser.mobile = '8264083932';
            localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
          }
          setUser(parsedUser);
          userRef.current = parsedUser;
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Polling every 5 seconds for smooth operations across all tabs
  useEffect(() => {
    if (!token || !user) return;

    // Prompt for notification permissions for suppliers
    if (user.roles?.some((r) => r === 'ROLE_SUPPLIER' || r === 'SUPPLIER')) {
      requestNotificationPermission();
    }

    refreshAllData();

    const handleVisibilityChange = () => {
      refreshAllData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Continuous polling every 4 seconds, ALWAYS active in foreground and background
    const interval = setInterval(() => {
      refreshAllData();
    }, 4000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user?.id, refreshAllData]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const cleanCredentials = {
        username: (credentials.username || '').trim().toLowerCase(),
        password: credentials.password
      };
      const res = await authApi.login(cleanCredentials);
      if (res.success && res.data) {
        const { accessToken, ...rawUserData } = res.data;
        const userData = {
          ...rawUserData,
          id: rawUserData.id || rawUserData.userId
        };
        if (userData.username === 'admin' || userData.roles?.includes('ROLE_ADMIN') || userData.roles?.includes('ADMIN')) {
          userData.whatsapp = '+918264083932';
          userData.mobile = '8264083932';
        }

        const supportedRoles = userData.roles?.some((role) =>
          ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_SUPPLIER', 'ROLE_DISPATCHER', 'ADMIN', 'SUPPLIER'].includes(role)
        );
        if (!supportedRoles) {
          return { success: false, message: 'This account does not have access to the supplier portal.' };
        }

        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        userRef.current = userData;

        setTimeout(refreshAllData, 50);
        return { success: true, user: userData };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      let message = 'Login failed. Please verify your credentials.';
      if (isServerUnavailableError(err)) {
        message = SERVER_UNAVAILABLE_MESSAGE;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (passwords) => {
    try {
      const res = await authApi.changePassword(passwords);
      if (res.success) {
        setUser((prev) => {
          const updated = { ...prev, requiresPasswordChange: false };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          return updated;
        });
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Password update failed.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    userRef.current = null;
    setSuppliers([]);
    setVehicles([]);
    setBookingRequests([]);
    setNotifications([]);
  };

  // ── SUPPLIERS ────────────────────────────────────────────────────────────
  const createSupplier = async ({ username, password, fullName, companyName, whatsapp, city, vehicleLimit }) => {
    try {
      const res = await supplierApi.createSupplier({
        username: username.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        companyName: companyName ? companyName.trim() : '',
        whatsapp: whatsapp ? whatsapp.trim() : '',
        city,
        vehicleLimit: vehicleLimit ? Number(vehicleLimit) : 5
      });
      if (res.success) {
        // Instant Live Reflection
        if (res.data) {
          setSuppliers((prev) => [res.data, ...prev]);
        }
        await refreshAllData();
        return { success: true, supplier: res.data };
      }
      return { success: false, message: res.message || 'Failed to create supplier' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create supplier';
      return { success: false, message };
    }
  };

  const getSuppliers = () => suppliers;

  const setSupplierStatus = async (supplierId, active) => {
    try {
      // Instant Live Reflection
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, status: active ? 'ACTIVE' : 'INACTIVE', active } : s))
      );
      await supplierApi.setSupplierStatus(supplierId, active);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to update status' };
    }
  };

  const updateSupplier = async (supplierId, changes) => {
    try {
      // Instant Live Reflection
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, ...changes } : s))
      );
      const res = await supplierApi.updateSupplier(supplierId, changes);
      if (res.success) {
        if (res.data) {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === supplierId ? { ...s, ...res.data } : s))
          );
        }
        await refreshAllData();
        return { success: true, data: res.data };
      }
      await refreshAllData();
      return { success: false, message: res.message };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to update supplier' };
    }
  };

  const deleteSupplier = async (supplierId) => {
    try {
      // Instant Live Reflection
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
      setVehicles((prev) => prev.filter((v) => String(v.supplierId) !== String(supplierId)));
      await supplierApi.deleteSupplier(supplierId);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to delete supplier' };
    }
  };

  const resetSupplierPassword = async (supplierId, newPassword) => {
    try {
      const res = await supplierApi.resetPassword(supplierId, newPassword);
      if (res.success) {
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to reset supplier password' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to reset supplier password' };
    }
  };

  const toggleSupplierOnline = async (id) => {
    try {
      const res = await supplierApi.toggleOnline(id);
      if (res.success && res.data) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...res.data } : s))
        );
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Failed to toggle status' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to toggle status' };
    }
  };

  // ── CITIES ───────────────────────────────────────────────────────────────
  const addCity = async (name) => {
    try {
      const clean = name.trim();
      const res = await cityApi.addCity(clean);
      if (res.success) {
        const newCityObj = res.data || { id: Date.now(), name: clean };
        setCities((prev) => {
          const exists = prev.some((c) => (c.name || c).toLowerCase() === clean.toLowerCase());
          return exists ? prev : [...prev, newCityObj];
        });
        await refreshAllData();
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to add city' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add city' };
    }
  };

  const deleteCity = async (cityIdentifier) => {
    try {
      let idToDelete = null;
      let nameToDelete = '';

      if (typeof cityIdentifier === 'object' && cityIdentifier !== null) {
        idToDelete = cityIdentifier.id;
        nameToDelete = cityIdentifier.name;
      } else if (!isNaN(Number(cityIdentifier))) {
        idToDelete = Number(cityIdentifier);
        const match = cities.find((c) => c.id === idToDelete);
        nameToDelete = match ? match.name : '';
      } else {
        nameToDelete = String(cityIdentifier);
        const match = cities.find((c) => (c.name || c).toLowerCase() === nameToDelete.toLowerCase());
        idToDelete = match?.id || null;
      }

      // Instant Live Reflection
      setCities((prev) =>
        prev.filter((c) => {
          if (idToDelete && c.id === idToDelete) return false;
          if (nameToDelete && (c.name || c).toLowerCase() === nameToDelete.toLowerCase()) return false;
          return true;
        })
      );

      await cityApi.deleteCity(idToDelete, nameToDelete);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to delete city' };
    }
  };

  // ── VEHICLE GROUPS ────────────────────────────────────────────────────────
  const addVehicleGroup = async (name) => {
    try {
      const clean = name.trim();
      const res = await vehicleGroupApi.addVehicleGroup(clean);
      if (res.success) {
        const newGroup = res.data || { id: Date.now(), name: clean };
        setVehicleGroups((prev) => {
          const exists = prev.some((g) => (g.name || g).toLowerCase() === clean.toLowerCase());
          return exists ? prev : [...prev, newGroup];
        });
        await refreshAllData();
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to add vehicle group' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add vehicle group' };
    }
  };

  const deleteVehicleGroup = async (groupIdOrName) => {
    try {
      let idToDelete = null;
      let nameToDelete = '';

      if (typeof groupIdOrName === 'object' && groupIdOrName !== null) {
        idToDelete = groupIdOrName.id;
        nameToDelete = groupIdOrName.name;
      } else if (!isNaN(Number(groupIdOrName))) {
        idToDelete = Number(groupIdOrName);
        const match = vehicleGroups.find((g) => g.id === idToDelete);
        nameToDelete = match ? match.name : '';
      } else {
        nameToDelete = String(groupIdOrName);
        const match = vehicleGroups.find((g) => (g.name || g).toLowerCase() === nameToDelete.toLowerCase());
        idToDelete = match?.id || null;
      }

      // Instant Live Reflection
      setVehicleGroups((prev) =>
        prev.filter((g) => {
          if (idToDelete && g.id === idToDelete) return false;
          if (nameToDelete && (g.name || g).toLowerCase() === nameToDelete.toLowerCase()) return false;
          return true;
        })
      );

      await vehicleGroupApi.deleteVehicleGroup(idToDelete, nameToDelete);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to delete vehicle group' };
    }
  };

  // ── VEHICLES ─────────────────────────────────────────────────────────────
  const createVehicle = async ({ name, number, model, supplierId }) => {
    try {
      const targetSupplierId = supplierId || user?.id;
      const res = await vehicleApi.createVehicle({
        name: name.trim(),
        number: number.trim().toUpperCase(),
        model: model.trim(),
        supplierId: targetSupplierId
      });
      if (res.success && res.data) {
        // Instant Live Reflection
        setVehicles((prev) => [res.data, ...prev.filter((v) => v.id !== res.data.id)]);
        setSuppliers((prev) =>
          prev.map((s) =>
            String(s.id) === String(targetSupplierId)
              ? { ...s, vehicleCount: (s.vehicleCount || 0) + 1 }
              : s
          )
        );
        await refreshAllData();
        return { success: true, vehicle: res.data };
      }
      return { success: false, message: res.message || 'Failed to register vehicle' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to register vehicle' };
    }
  };

  const getVehicles = (supplierId) => {
    if (supplierId) {
      return vehicles.filter((v) => String(v.supplierId) === String(supplierId));
    }
    return vehicles;
  };

  const setVehicleStatus = async (vehicleId, status) => {
    try {
      // Instant Live Reflection
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, status } : v))
      );
      await vehicleApi.setVehicleStatus(vehicleId, status);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to update status' };
    }
  };

  const updateVehicle = async (vehicleId, changes) => {
    try {
      // Instant Live Reflection
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, ...changes } : v))
      );
      const res = await vehicleApi.updateVehicle(vehicleId, changes);
      if (res.success) {
        await refreshAllData();
        return { success: true };
      }
      await refreshAllData();
      return { success: false, message: res.message };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to update vehicle' };
    }
  };

  const deleteVehicle = async (vehicleId) => {
    try {
      const vToDelete = vehicles.find((v) => v.id === vehicleId);
      // Instant Live Reflection
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      if (vToDelete?.supplierId) {
        setSuppliers((prev) =>
          prev.map((s) =>
            String(s.id) === String(vToDelete.supplierId)
              ? { ...s, vehicleCount: Math.max(0, (s.vehicleCount || 1) - 1) }
              : s
          )
        );
      }
      await vehicleApi.deleteVehicle(vehicleId);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to delete vehicle' };
    }
  };

  // ── BOOKING REQUESTS ─────────────────────────────────────────────────────
  const createBookingRequest = async ({
    vehicleId,
    message,
    remarks,
    pickupDate,
    pickupTime,
    dutyType,
    pickupLocation,
    dropLocation,
    passengerName,
    passengerPhone
  }) => {
    try {
      const res = await bookingApi.createBooking({
        vehicleId,
        remarks: remarks || message || '',
        message: message || remarks || '',
        pickupDate: pickupDate || '',
        pickupTime: pickupTime || '',
        dutyType: dutyType || '8/80',
        pickupLocation: pickupLocation || '',
        dropLocation: dropLocation || '',
        passengerName: passengerName || '',
        passengerPhone: passengerPhone || ''
      });
      if (res.success && res.data) {
        // Instant Live Reflection
        setBookingRequests((prev) => [res.data, ...prev]);
        await refreshAllData();
        return { success: true, request: res.data };
      }
      return { success: false, message: res.message || 'Failed to dispatch booking' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to dispatch booking' };
    }
  };

  const getBookingRequests = (supplierId) => {
    if (supplierId) {
      return bookingRequests.filter((r) => String(r.supplierId) === String(supplierId));
    }
    return bookingRequests;
  };

  const setBookingRequestStatus = async (requestId, status) => {
    // Immediately terminate alarm audio on decision
    if (status === 'CONFIRMED' || status === 'DECLINED') {
      stopNotificationSound();
    }
    try {
      // Instant Live Reflection
      setBookingRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
      await bookingApi.updateStatus(requestId, status);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      await refreshAllData();
      return { success: false, message: err.response?.data?.message || 'Failed to update request' };
    }
  };

  const completeBookingDuty = async (requestId) => {
    stopNotificationSound();
    try {
      await bookingApi.completeBooking(requestId);
      await refreshAllData();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to complete duty' };
    }
  };

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  const getNotifications = (recipientId) => {
    if (recipientId) {
      return notifications.filter(
        (n) => n.recipientId === String(recipientId) || (user?.roles?.includes('ROLE_ADMIN') && n.recipientId === 'admin-1')
      );
    }
    return notifications;
  };

  const markNotificationRead = async (notificationId) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      await notificationApi.markRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllNotificationsRead = async (recipientId) => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await notificationApi.markAllRead(recipientId);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    const target = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
    return user.roles.includes(target);
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    requiresPasswordChange: !!user?.requiresPasswordChange,
    cities,
    addCity,
    deleteCity,
    vehicleGroups,
    addVehicleGroup,
    deleteVehicleGroup,
    suppliers,
    vehicles,
    bookingRequests,
    notifications,
    refreshAllData,
    login,
    logout,
    changePassword,
    createSupplier,
    getSuppliers,
    setSupplierStatus,
    updateSupplier,
    deleteSupplier,
    resetSupplierPassword,
    toggleSupplierOnline,
    createVehicle,
    getVehicles,
    setVehicleStatus,
    updateVehicle,
    deleteVehicle,
    createBookingRequest,
    getBookingRequests,
    setBookingRequestStatus,
    completeBookingDuty,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    hasRole,
    playNotificationChime,
    playSupplierDutyChime
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
