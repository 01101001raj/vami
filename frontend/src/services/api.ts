import axios from 'axios';
import type { AuthResponse, User, Agent, Conversation, Usage } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; company_name?: string; plan: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<User>('/auth/me'),
};

// Agent API
export const agentAPI = {
  getAgent: () => api.get<Agent>('/agents'),

  updateAgent: (agentId: string, data: any) =>
    api.put<Agent>(`/agents/${agentId}`, data),
};

// Analytics API
export const analyticsAPI = {
  getConversations: (page = 1, perPage = 20) =>
    api.get<Conversation[]>('/analytics/conversations', { params: { page, per_page: perPage } }),

  getConversation: (id: string) =>
    api.get<Conversation>(`/analytics/conversations/${id}`),

  getStats: (days = 7) =>
    api.get('/analytics/stats', { params: { days } }),
};

// Billing API
export const billingAPI = {
  createCheckout: (data: { plan: string; success_url?: string; cancel_url?: string }) =>
    api.post('/billing/create-checkout', data),

  cancelSubscription: () => api.post('/billing/cancel'),

  reactivateSubscription: () => api.post('/billing/reactivate'),

  getCustomerPortal: () => api.post<{ portal_url: string }>('/billing/portal'),

  getUsage: () => api.get<Usage>('/billing/usage'),
};

// Integrations API
export const integrationsAPI = {
  getGoogleAuthUrl: () => api.get<{ auth_url: string; state: string }>('/integrations/google/auth-url'),

  handleGoogleCallback: (code: string) =>
    api.post('/integrations/google/callback', { code }),

  listCalendars: () => api.get('/integrations/google/calendars'),

  disconnectGoogle: () => api.delete('/integrations/google/disconnect'),
};

export default api;
