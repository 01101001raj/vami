import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { integrationsAPI } from '../services/api';
import { Calendar, CheckCircle, ExternalLink, User, Building, Mail, Lock, Bell, Globe, Zap, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [connecting, setConnecting] = useState(false);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      const response = await integrationsAPI.getGoogleAuthUrl();
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Failed to get Google auth URL', error);
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="mt-2 text-gray-600">Manage your account, integrations, and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-600 mt-0.5">Manage your personal details</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                value={user?.company_name || ''}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1.5">Contact support to change company name</p>
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1.5">Primary email for notifications</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Account Security</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Your account is secured with industry-standard encryption. Enable two-factor authentication for additional security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
              <p className="text-sm text-gray-600 mt-0.5">Connect with external services</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Google Calendar */}
            <div className="flex items-center justify-between p-5 border-2 border-gray-200 hover:border-emerald-200 rounded-xl transition-all bg-gradient-to-r from-white to-gray-50 group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Google Calendar</p>
                  <p className="text-sm text-gray-600 mt-0.5">Sync appointments automatically to your calendar</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Popular</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">Recommended</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{connecting ? 'Connecting...' : 'Connect'}</span>
              </button>
            </div>

            {/* Feature availability notice */}
            {user?.features.calendar_booking && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900 text-base">Calendar Integration Available</p>
                    <p className="text-sm text-green-700 mt-1.5">
                      Your plan includes automatic appointment booking. Connect your Google Calendar to enable this feature and start scheduling appointments automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Coming Soon Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 opacity-60">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <Mail className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">Email Integration</p>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Send automated email follow-ups</p>
              </div>

              <div className="p-5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 opacity-60">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gray-200 rounded-lg">
                    <Globe className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-700">CRM Integration</p>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Coming Soon</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Sync contacts with your CRM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Agent Configuration</h2>
              <p className="text-sm text-gray-600 mt-0.5">Customize your agent's behavior</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Agent Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Sarah - Medical Assistant"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">Give your AI agent a memorable name</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Business Hours</span>
              </label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white">
                <option>24/7 - Always Available</option>
                <option>Business Hours (9 AM - 5 PM)</option>
                <option>Extended Hours (8 AM - 8 PM)</option>
                <option>Custom Schedule</option>
              </select>
              <p className="text-xs text-gray-500 mt-1.5">When your agent should accept calls</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <span>Language</span>
              </label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
              <p className="text-xs text-gray-500 mt-1.5">Primary language for conversations</p>
            </div>

            <button className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg">
              Save Agent Settings
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600 mt-0.5">Manage your notification preferences</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { title: 'Call Notifications', desc: 'Get notified when your agent receives a call', enabled: true },
              { title: 'Daily Summary', desc: 'Receive a daily report of your agent activity', enabled: true },
              { title: 'Usage Alerts', desc: 'Alert me when I reach 80% of my monthly limit', enabled: true },
              { title: 'Marketing Emails', desc: 'Receive updates about new features and tips', enabled: false },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={item.enabled} />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
              <p className="text-sm text-gray-600 mt-0.5">Manage your account security</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-5 border-2 border-gray-200 hover:border-emerald-300 rounded-xl transition-all group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">Update your password regularly for security</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-5 border-2 border-gray-200 hover:border-emerald-300 rounded-xl transition-all group">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold">Not Enabled</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
