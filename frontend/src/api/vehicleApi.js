import axiosClient from './axiosClient';

export const vehicleApi = {
  getVehicles: async (supplierId) => {
    const params = supplierId ? { supplierId } : {};
    const response = await axiosClient.get('/vehicles', { params });
    return response.data;
  },

  createVehicle: async (data) => {
    const response = await axiosClient.post('/vehicles', data);
    return response.data;
  },

  updateVehicle: async (id, data) => {
    const response = await axiosClient.put(`/vehicles/${id}`, data);
    return response.data;
  },

  setVehicleStatus: async (id, status) => {
    const response = await axiosClient.patch(`/vehicles/${id}/status?status=${encodeURIComponent(status)}`);
    return response.data;
  },

  deleteVehicle: async (id) => {
    const response = await axiosClient.delete(`/vehicles/${id}`);
    return response.data;
  }
};
