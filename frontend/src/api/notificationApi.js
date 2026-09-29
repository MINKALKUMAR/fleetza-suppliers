import axiosClient from './axiosClient';

export const notificationApi = {
  getNotifications: async (recipientId) => {
    const params = recipientId ? { recipientId } : {};
    const response = await axiosClient.get('/notifications', { params });
    return response.data;
  },

  markRead: async (id) => {
    const response = await axiosClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async (recipientId) => {
    const params = recipientId ? { recipientId } : {};
    const response = await axiosClient.patch('/notifications/read-all', null, { params });
    return response.data;
  }
};
