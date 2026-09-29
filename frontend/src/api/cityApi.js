import axiosClient from './axiosClient';

export const DEFAULT_CITIES = ['Chandigarh', 'Ludhiana', 'Jalandhar', 'Amritsar', 'Bathinda', 'Ambala', 'Jammu'];

export const cityApi = {
  getCities: async () => {
    try {
      const response = await axiosClient.get('/cities');
      if (response.data && response.data.data) {
        return response.data;
      }
      return { success: true, data: DEFAULT_CITIES.map((name, i) => ({ id: i + 1, name })) };
    } catch {
      // Fallback to localStorage or defaults
      const stored = localStorage.getItem('fleetza_cities');
      const list = stored ? JSON.parse(stored) : DEFAULT_CITIES;
      return { success: true, data: list.map((name, i) => ({ id: i + 1, name })) };
    }
  },

  addCity: async (name) => {
    try {
      const response = await axiosClient.post('/cities', { name: name.trim() });
      return response.data;
    } catch (err) {
      // Offline fallback
      const stored = localStorage.getItem('fleetza_cities');
      const list = stored ? JSON.parse(stored) : [...DEFAULT_CITIES];
      if (!list.includes(name.trim())) {
        list.push(name.trim());
        localStorage.setItem('fleetza_cities', JSON.stringify(list));
      }
      return { success: true, data: { id: Date.now(), name: name.trim() } };
    }
  },

  deleteCity: async (id, cityName) => {
    try {
      if (id && !isNaN(Number(id))) {
        const response = await axiosClient.delete(`/cities/${id}`);
        return response.data;
      }
      return { success: true };
    } catch (err) {
      const stored = localStorage.getItem('fleetza_cities');
      if (stored) {
        const list = JSON.parse(stored).filter((c) => c !== cityName);
        localStorage.setItem('fleetza_cities', JSON.stringify(list));
      }
      return { success: true };
    }
  }
};
