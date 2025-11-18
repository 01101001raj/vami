import axios from 'axios';
import type {
  AuthResponse,
  User,
  Agent,
  Conversation,
  Usage,
  AgentUpdateData,
  DashboardStats,
  AgentToken,
  KnowledgeBaseFile,
  TeamMember,
  TeamInvitation,
  CalendarIntegration,
  Appointment,
  AvailabilitySlot,
  Call,
  NotificationPreferences,
  APIKey,
  Webhook
} from '../types';

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

// ============================================================
// AUTH API
// ============================================================

export const authAPI = {
  register: (data: { email: string; password: string; company_name?: string; plan: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get<User>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', null, { params: { email } }),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', { access_token: data.token, new_password: data.password }),
};

// ============================================================
// AGENT API
// ============================================================

export const agentAPI = {
  createAgent: (data: any) => api.post<Agent>('/agents', data),

  getAgent: () => api.get<Agent>('/agents'),

  updateAgent: (agentId: string, data: AgentUpdateData) =>
    api.put<Agent>(`/agents/${agentId}`, data),

  getApiToken: (agentId: string) =>
    api.get<AgentToken>(`/agents/${agentId}/api-token`),

  regenerateApiToken: (agentId: string) =>
    api.post<AgentToken>(`/agents/${agentId}/regenerate-token`),

  // Knowledge Base
  uploadFile: (agentId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<KnowledgeBaseFile>(
      `/agents/knowledge-base/upload`,
      formData,
      {
        params: { agent_id: agentId },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  listFiles: (agentId: string) =>
    api.get<KnowledgeBaseFile[]>('/agents/knowledge-base/files', {
      params: { agent_id: agentId },
    }),

  deleteFile: (fileId: string) =>
    api.delete(`/agents/knowledge-base/files/${fileId}`),
};

// ============================================================
// ANALYTICS API
// ============================================================

export const analyticsAPI = {
  getConversations: (page = 1, perPage = 20) =>
    api.get<Conversation[]>('/analytics/conversations', {
      params: { page, per_page: perPage },
    }),

  getConversation: (id: string) =>
    api.get<Conversation>(`/analytics/conversations/${id}`),

  getStats: (days = 7) =>
    api.get<DashboardStats>('/analytics/stats', { params: { days } }),
};

// ============================================================
// BILLING API
// ============================================================

export const billingAPI = {
  createCheckout: (data: { plan: string; success_url?: string; cancel_url?: string }) =>
    api.post('/billing/create-checkout', data),

  cancelSubscription: () => api.post('/billing/cancel'),

  reactivateSubscription: () => api.post('/billing/reactivate'),

  getCustomerPortal: () => api.post<{ portal_url: string }>('/billing/portal'),

  getUsage: () => api.get<Usage>('/billing/usage'),

  updatePlan: (plan: string) =>
    api.post('/billing/update-plan', { plan }),

  getInvoices: () => api.get('/billing/invoices'),
};

// ============================================================
// TEAM API
// ============================================================

export const teamAPI = {
  getMembers: () => api.get<TeamMember[]>('/team/members'),

  inviteMember: (data: { email: string; role: 'admin' | 'editor' | 'viewer' }) =>
    api.post<TeamInvitation>('/team/invite', data),

  updateRole: (memberId: string, role: string) =>
    api.put(`/team/members/${memberId}/role`, { role }),

  removeMember: (memberId: string) =>
    api.delete(`/team/members/${memberId}`),

  getInvitations: () => api.get<TeamInvitation[]>('/team/invitations'),

  cancelInvitation: (invitationId: string) =>
    api.delete(`/team/invitations/${invitationId}`),

  acceptInvitation: (token: string) =>
    api.post('/team/accept-invitation', { invitation_token: token }),

  getPermissions: () => api.get('/team/permissions'),

  getStats: () => api.get('/team/stats'),
};

// ============================================================
// CALENDAR API
// ============================================================

export const calendarAPI = {
  getIntegrations: () => api.get<CalendarIntegration[]>('/calendar/integrations'),

  getAuthUrl: (provider: 'google' | 'outlook' | 'apple') =>
    api.get<{ auth_url: string; state: string }>(`/calendar/auth-url/${provider}`),

  handleCallback: (provider: string, code: string, state: string) =>
    api.post('/calendar/callback', { provider, code, state }),

  disconnectCalendar: (integrationId: string) =>
    api.delete(`/calendar/integrations/${integrationId}`),

  listAppointments: (params?: { start_date?: string; end_date?: string; status?: string }) =>
    api.get<Appointment[]>('/calendar/appointments', { params }),

  getAppointment: (appointmentId: string) =>
    api.get<Appointment>(`/calendar/appointments/${appointmentId}`),

  createAppointment: (data: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    attendee_email?: string;
    attendee_name?: string;
    attendee_phone?: string;
  }) => api.post<Appointment>('/calendar/appointments', data),

  updateAppointment: (appointmentId: string, data: any) =>
    api.put<Appointment>(`/calendar/appointments/${appointmentId}`, data),

  cancelAppointment: (appointmentId: string, reason?: string) =>
    api.delete(`/calendar/appointments/${appointmentId}`, {
      data: { reason },
    }),

  checkAvailability: (data: { date: string; duration_minutes: number }) =>
    api.post<{ slots: AvailabilitySlot[] }>('/calendar/check-availability', data),

  syncCalendar: (integrationId: string) =>
    api.post(`/calendar/integrations/${integrationId}/sync`),

  getSettings: () => api.get('/calendar/settings'),

  updateSettings: (data: any) =>
    api.put('/calendar/settings', data),
};

// ============================================================
// CALLS API
// ============================================================

export const callsAPI = {
  listCalls: (params?: { status?: string; direction?: string; page?: number; per_page?: number }) =>
    api.get<Call[]>('/calls', { params }),

  getCall: (callId: string) =>
    api.get<Call>(`/calls/${callId}`),

  initiateCall: (data: { phone_number: string; agent_id: string; scheduled_at?: string }) =>
    api.post<Call>('/calls/initiate', data),

  cancelCall: (callId: string) =>
    api.delete(`/calls/${callId}`),

  getStats: (days = 30) =>
    api.get('/calls/stats', { params: { days } }),
};

// ============================================================
// SETTINGS API
// ============================================================

export const settingsAPI = {
  // Notifications
  getNotificationPreferences: () =>
    api.get<NotificationPreferences>('/settings/notifications'),

  updateNotificationPreferences: (data: Partial<NotificationPreferences>) =>
    api.put<NotificationPreferences>('/settings/notifications', data),

  // API Keys
  listApiKeys: () => api.get<APIKey[]>('/settings/api-keys'),

  createApiKey: (data: { name: string; permissions: string[]; expires_at?: string }) =>
    api.post<APIKey>('/settings/api-keys', data),

  deleteApiKey: (keyId: string) =>
    api.delete(`/settings/api-keys/${keyId}`),

  // Webhooks
  listWebhooks: () => api.get<Webhook[]>('/settings/webhooks'),

  createWebhook: (data: { name: string; url: string; events: string[]; secret?: string }) =>
    api.post<Webhook>('/settings/webhooks', data),

  updateWebhook: (webhookId: string, data: any) =>
    api.put<Webhook>(`/settings/webhooks/${webhookId}`, data),

  deleteWebhook: (webhookId: string) =>
    api.delete(`/settings/webhooks/${webhookId}`),

  testWebhook: (webhookId: string) =>
    api.post(`/settings/webhooks/${webhookId}/test`),
};

// ============================================================
// INTEGRATIONS API (Legacy - kept for compatibility)
// ============================================================

export const integrationsAPI = {
  getGoogleAuthUrl: () => api.get<{ auth_url: string; state: string }>('/integrations/google/auth-url'),

  handleGoogleCallback: (code: string, state: string) =>
    api.post('/integrations/google/callback', { code, state }),

  listCalendars: () => api.get('/integrations/google/calendars'),

  disconnectGoogle: () => api.delete('/integrations/google/disconnect'),
};

export default api;
