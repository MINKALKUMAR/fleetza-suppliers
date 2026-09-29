import axiosClient from './axiosClient';

export const bookingApi = {
  getBookings: async (supplierId) => {
    const params = supplierId ? { supplierId } : {};
    const response = await axiosClient.get('/bookings', { params });
    return response.data;
  },

  createBooking: async (data) => {
    const response = await axiosClient.post('/bookings', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await axiosClient.patch(`/bookings/${id}/status?status=${encodeURIComponent(status)}`);
    return response.data;
  },

  completeBooking: async (id) => {
    const response = await axiosClient.patch(`/bookings/${id}/complete`);
    return response.data;
  }
};
