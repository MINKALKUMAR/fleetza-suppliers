import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await axiosClient.post('/auth/change-password', passwordData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  },

  updateFcmToken: async (token) => {
    const response = await axiosClient.post('/auth/fcm-token', { token });
    return response.data;
  }
};
