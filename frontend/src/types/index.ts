// ============================================================
// USER & AUTH TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  company_name?: string;
  plan: string;
  subscription_status: string;
  features: UserFeatures;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFeatures {
  minutes_limit: number;
  concurrent_calls: number;
  business_numbers: number;
  team_members: number;
  inbound_calls: boolean;
  outbound_calls: boolean;
  calendar_booking: boolean;
  email_confirmations: boolean;
  sms_confirmations: boolean;
  call_transcripts: boolean;
  call_recordings: boolean;
  basic_analytics: boolean;
  advanced_analytics: boolean;
  sentiment_analysis: boolean;
  priority_support: boolean;
  custom_integrations: boolean;
  voice_cloning: boolean;
  call_routing: boolean;
  multi_location: boolean;
  white_labeling: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: User;
  checkout_url?: string;
}

// ============================================================
// AGENT TYPES
// ============================================================

export interface Agent {
  id: number;
  user_id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  api_token?: string;
  elevenlabs_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AgentToken {
  agent_id: string;
  api_token: string;
  token_preview: string;
  message: string;
}

export interface KnowledgeBaseFile {
  id: string;
  user_id: string;
  agent_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  storage_url: string;
  uploaded_at: string;
  processed: boolean;
}

// ============================================================
// CONVERSATION & ANALYTICS TYPES
// ============================================================

export interface Conversation {
  id: number;
  conversation_id: string;
  agent_id: string;
  end_user_id?: string;
  duration_secs?: number;
  total_cost?: number;
  call_successful?: string;
  summary?: string;
  title?: string;
  sentiment?: string;
  intent?: string;
  webhook_payload?: any;
  created_at: string;
}

export interface AnalyticsStats {
  total_conversations: number;
  total_duration_minutes: number;
  successful_calls: number;
  failed_calls: number;
  average_duration: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  intent_breakdown: Record<string, number>;
  calls_by_day: Array<{ date: string; count: number }>;
}

// ============================================================
// BILLING & USAGE TYPES
// ============================================================

export interface Usage {
  minutes_used: number;
  minutes_limit: number;
  percentage_used: number;
  billing_period_start: string;
  billing_period_end: string;
  recent_usage: Array<{
    date: string;
    minutes: number;
  }>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

// ============================================================
// TEAM TYPES
// ============================================================

export interface TeamMember {
  id: string;
  email: string;
  full_name?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar_url?: string;
  joined_at: string;
  last_active?: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_by_email: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

// ============================================================
// CALENDAR TYPES
// ============================================================

export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: 'google' | 'outlook' | 'apple';
  provider_email: string;
  calendar_id?: string;
  calendar_name?: string;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync?: string;
  created_at: string;
  access_token_expires?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  calendar_integration_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  attendee_email?: string;
  attendee_name?: string;
  attendee_phone?: string;
  external_event_id?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

// ============================================================
// CALLS TYPES
// ============================================================

export interface Call {
  id: string;
  user_id: string;
  agent_id: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  external_call_id?: string;
  conversation_id?: string;
  metadata?: any;
  created_at: string;
}

// ============================================================
// SETTINGS TYPES
// ============================================================

export interface NotificationPreferences {
  email_notifications: {
    new_conversation: boolean;
    appointment_booked: boolean;
    usage_limit_warning: boolean;
    payment_failed: boolean;
    weekly_summary: boolean;
  };
  sms_notifications: {
    critical_alerts: boolean;
  };
}

export interface APIKey {
  id: string;
  name: string;
  key_preview: string;
  permissions: string[];
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  status: 'active' | 'inactive' | 'failed';
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}
