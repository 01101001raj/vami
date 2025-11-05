import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { integrationsAPI } from '../services/api';
import { Calendar, CheckCircle, ExternalLink } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and integrations</p>
      </div>

      {/* Account Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Company Name</label>
            <input
              type="text"
              value={user?.company_name || ''}
              className="input"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="input"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-gray-600">Sync appointments with your calendar</p>
              </div>
            </div>
            <button
              onClick={handleConnectGoogle}
              disabled={connecting}
              className="btn btn-primary flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{connecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          </div>

          {user?.features.calendar_booking && (
            <div className="p-4 bg-green-50 rounded-lg flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Calendar Integration Available</p>
                <p className="text-sm text-green-700 mt-1">
                  Connect your Google Calendar to enable automatic appointment booking.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Agent Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              placeholder="My Medical Assistant"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Hours
            </label>
            <select className="input">
              <option>24/7</option>
              <option>Business Hours (9 AM - 5 PM)</option>
              <option>Custom</option>
            </select>
          </div>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
