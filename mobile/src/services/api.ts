import axios from 'axios';

// Force absolute URL for Capacitor Mobile APK
const baseURL = import.meta.env.VITE_API_URL || 'https://optik.codenusa.id/api';
const api = axios.create({ baseURL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r.data, e => Promise.reject(e));

const get = (url: string, config?: any): Promise<any> => api.get(url, config);
const post = (url: string, data?: any, config?: any): Promise<any> => api.post(url, data, config);
const put = (url: string, data?: any, config?: any): Promise<any> => api.put(url, data, config);
const patch = (url: string, data?: any, config?: any): Promise<any> => api.patch(url, data, config);

export const patientsService = {
  getAll: (): Promise<any[]> => get('/patients'),
  getById: (id: string): Promise<any> => get(`/patients/${id}`),
  create: (data: unknown): Promise<any> => post('/patients', data),
  update: (id: string, data: unknown): Promise<any> => put(`/patients/${id}`, data),
  delete: (id: string): Promise<any> => api.delete(`/patients/${id}`),
};

export const examinationsService = {
  getAll: (): Promise<any[]> => get('/examinations'),
  getById: (id: string): Promise<any> => get(`/examinations/${id}`),
  create: (data: unknown): Promise<any> => post('/examinations', data),
};

export const transactionsService = {
  getAll: (): Promise<any[]> => get('/transactions'),
  getById: (id: string): Promise<any> => get(`/transactions/${id}`),
  create: (data: unknown): Promise<any> => post('/transactions', data),
  updateStatus: (id: string, data: unknown): Promise<any> => patch(`/transactions/${id}/status`, data),
};

export const stockService = {
  getAll: (): Promise<any[]> => get('/stock'),
  create: (data: unknown): Promise<any> => post('/stock', data),
  update: (id: string, data: unknown): Promise<any> => put(`/stock/${id}`, data),
  adjust: (id: string, adjustment: number): Promise<any> => patch(`/stock/${id}/adjust`, { adjustment }),
  delete: (id: string): Promise<any> => api.delete(`/stock/${id}`),
};

export const cashbookService = {
  getAll: (period?: string): Promise<any[]> => get('/cashflow', { params: period ? { period } : {} }),
  getSummary: (): Promise<any> => get('/cashflow/summary/today'),
  create: (data: unknown): Promise<any> => post('/cashflow', data),
};

export const reportsService = {
  getSales: (params?: Record<string, string>): Promise<any> => get('/reports/sales', { params }),
  getClinical: (params?: Record<string, string>): Promise<any> => get('/reports/clinical', { params }),
};

export const authService = {
  login: (username: string, password: string): Promise<any> =>
    post('/auth/login', { username, password }),
  getMe: () => get('/auth/me'),
};

export default api;

