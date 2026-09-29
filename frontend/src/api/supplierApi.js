import axiosClient from './axiosClient';

export const supplierApi = {
  getSuppliers: async () => {
    const response = await axiosClient.get('/suppliers');
    return response.data;
  },

  createSupplier: async (data) => {
    const response = await axiosClient.post('/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id, data) => {
    const response = await axiosClient.put(`/suppliers/${id}`, data);
    return response.data;
  },

  setSupplierStatus: async (id, active) => {
    const status = active ? 'ACTIVE' : 'INACTIVE';
    const response = await axiosClient.patch(`/suppliers/${id}/status?status=${status}`);
    return response.data;
  },

  deleteSupplier: async (id) => {
    const response = await axiosClient.delete(`/suppliers/${id}`);
    return response.data;
  },

  resetPassword: async (id, newPassword) => {
    const response = await axiosClient.patch(`/suppliers/${id}/reset-password`, { newPassword });
    return response.data;
  },

  toggleOnline: async (id) => {
    const response = await axiosClient.patch(`/suppliers/${id}/toggle-online`);
    return response.data;
  }
};
