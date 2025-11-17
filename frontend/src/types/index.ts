export interface User {
  id: string;
  email: string;
  company_name?: string;
  plan: string;
  subscription_status: string;
  features: UserFeatures;
  created_at: string;
}

export interface UserFeatures {
  minutes_limit: number;
  concurrent_calls: number;
  business_numbers: number;
  team_members: number;
  inbound_calls: boolean;
  outbound_calls: boolean;
  calendar_booking: boolean;
  email_confirmation: boolean;
  sms_confirmation: boolean;
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
  dedicated_account_manager: boolean;
}

export interface ElevenLabsMetadata {
  name: string;
  prompt: string;
  voice?: {
    voice_id: string;
  };
  language?: string;
  conversation_config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Agent {
  id: number;
  user_id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  elevenlabs_metadata?: ElevenLabsMetadata;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  conversation_id: string;
  agent_id: string;
  end_user_id?: string;
  duration_secs?: number;
  call_successful?: string;
  summary?: string;
  title?: string;
  sentiment?: string;
  intent?: string;
  created_at: string;
}

export interface Usage {
  minutes_used: number;
  minutes_limit: number;
  percentage_used: number;
  billing_period_start: string;
  billing_period_end: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  checkout_url?: string;
}

export interface AgentUpdateData {
  agent_name?: string;
  status?: string;
  elevenlabs_metadata?: Partial<ElevenLabsMetadata>;
}

export interface DashboardStats {
  total_calls: number;
  total_minutes: number;
  successful_calls: number;
  success_rate: number;
  avg_duration_secs: number;
}
