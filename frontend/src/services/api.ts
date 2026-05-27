import axios from 'axios';

// Base API setup
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach authorization mock token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API Services
export const authService = {
  login: async (credentials: any) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },
};

export const patientsService = {
  getAll: async () => {
    const response = await apiClient.get('/api/patients');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await apiClient.get(`/api/patients/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/api/patients', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/patients/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/patients/${id}`);
    return response.data;
  },
};

export const stockService = {
  getAll: async () => {
    const response = await apiClient.get('/api/stock');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await apiClient.get(`/api/stock/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/api/stock', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/api/stock/${id}`, data);
    return response.data;
  },
  adjust: async (id: string, adjustment: number) => {
    const response = await apiClient.patch(`/api/stock/${id}/adjust`, { adjustment });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/stock/${id}`);
    return response.data;
  },
};

export const examinationsService = {
  getAll: async (patientId?: string) => {
    const response = await apiClient.get('/api/examinations', {
      params: patientId ? { patient_id: patientId } : {},
    });
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await apiClient.get(`/api/examinations/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/api/examinations', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/examinations/${id}`);
    return response.data;
  },
};

export const transactionsService = {
  getAll: async () => {
    const response = await apiClient.get('/api/transactions');
    return response.data;
  },
  getOne: async (id: string) => {
    const response = await apiClient.get(`/api/transactions/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/api/transactions', data);
    return response.data;
  },
  updateStatus: async (id: string, status: { order_status?: string; payment_status?: string; paid_amount?: number }) => {
    const response = await apiClient.patch(`/api/transactions/${id}/status`, status);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/api/transactions/${id}`);
    return response.data;
  },
};

import type { Cashflow, CashflowSummary } from 'optik88-shared';

export const cashflowService = {
  getTodaySummary: async (): Promise<CashflowSummary> => {
    const res = await apiClient.get('/api/cashflow/summary/today');
    return res.data;
  },
  getTodayRecords: async (): Promise<Cashflow[]> => {
    const res = await apiClient.get('/api/cashflow/records/today');
    return res.data;
  },
  create: async (data: Partial<Cashflow>): Promise<Cashflow> => {
    const res = await apiClient.post('/api/cashflow', data);
    return res.data;
  }
};
