import axiosClient from './axiosClient';

export const pushApi = {
  getVapidPublicKey: async () => {
    const response = await axiosClient.get('/push/vapid-public-key');
    return response.data;
  },

  getStatus: async () => {
    const response = await axiosClient.get('/push/status');
    return response.data;
  },

  subscribe: async (subscriptionJson) => {
    const response = await axiosClient.post('/push/subscribe', {
      endpoint: subscriptionJson.endpoint,
      keys: subscriptionJson.keys,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    });
    return response.data;
  },

  unsubscribe: async (endpoint) => {
    const response = await axiosClient.post('/push/unsubscribe', { endpoint });
    return response.data;
  },

  sendTestPush: async () => {
    const response = await axiosClient.post('/push/test');
    return response.data;
  }
};

