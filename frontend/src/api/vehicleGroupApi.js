import axiosClient from './axiosClient';

export const DEFAULT_VEHICLE_GROUPS = ['Dzire', 'Ertiga', 'Rumion', 'Crysta', 'Hycross', 'Innova', 'Sedan AC', 'SUV'];

export const vehicleGroupApi = {
  getVehicleGroups: async () => {
    try {
      const response = await axiosClient.get('/vehicle-groups');
      if (response.data && response.data.data) {
        return response.data;
      }
      return { success: true, data: DEFAULT_VEHICLE_GROUPS.map((name, i) => ({ id: i + 1, name })) };
    } catch {
      const stored = localStorage.getItem('fleetza_vehicle_groups');
      const list = stored ? JSON.parse(stored) : DEFAULT_VEHICLE_GROUPS;
      return { success: true, data: list.map((name, i) => ({ id: i + 1, name })) };
    }
  },

  addVehicleGroup: async (name) => {
    try {
      const response = await axiosClient.post('/vehicle-groups', { name: name.trim() });
      return response.data;
    } catch {
      const stored = localStorage.getItem('fleetza_vehicle_groups');
      const list = stored ? JSON.parse(stored) : [...DEFAULT_VEHICLE_GROUPS];
      if (!list.includes(name.trim())) {
        list.push(name.trim());
        localStorage.setItem('fleetza_vehicle_groups', JSON.stringify(list));
      }
      return { success: true, data: { id: Date.now(), name: name.trim() } };
    }
  },

  deleteVehicleGroup: async (id, groupName) => {
    try {
      if (id) {
        const response = await axiosClient.delete(`/vehicle-groups/${id}`);
        return response.data;
      }
      return { success: true };
    } catch {
      const stored = localStorage.getItem('fleetza_vehicle_groups');
      if (stored) {
        const list = JSON.parse(stored).filter((g) => g !== groupName);
        localStorage.setItem('fleetza_vehicle_groups', JSON.stringify(list));
      }
      return { success: true };
    }
  }
};
