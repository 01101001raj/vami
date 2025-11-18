import { useState, useEffect } from 'react';
import { agentAPI } from '../services/api';
import CreateAgentModal from '../components/CreateAgentModal';

interface Agent {
  id: number;
  user_id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  phone_number?: string;
  phone_number_status?: string;
  elevenlabs_metadata?: any;
}

export default function AgentSettingsPage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [agentName, setAgentName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAgent();
  }, []);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const response = await agentAPI.getAgent();
      setAgent(response.data);
      setAgentName(response.data.agent_name);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load agent settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agent) return;

    try {
      setSaving(true);
      setMessage(null);

      await agentAPI.updateAgent(agent.agent_id, {
        agent_name: agentName,
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      await loadAgent(); // Reload to get updated data
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewToken = async () => {
    if (showToken) {
      setShowToken(false);
      return;
    }

    try {
      if (!agent) return;
      const response = await agentAPI.getApiToken(agent.agent_id);
      setApiToken(response.data.api_token);
      setShowToken(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load API token' });
    }
  };

  const handleRegenerateToken = async () => {
    if (!agent) return;

    const confirmed = window.confirm(
      'Are you sure you want to regenerate your API token? Your old token will stop working immediately.'
    );

    if (!confirmed) return;

    try {
      const response = await agentAPI.regenerateApiToken(agent.agent_id);
      setApiToken(response.data.api_token);
      setShowToken(true);
      setMessage({ type: 'success', text: 'New API token generated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to regenerate API token' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent settings...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agent Found</h2>
              <p className="text-gray-600 mb-6">
                You don't have an AI agent set up yet. Create one to get started!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all mr-3"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Agent
              </button>
              <a
                href="/dashboard"
                className="inline-block px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Create Agent Modal */}
        <CreateAgentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadAgent();
            setMessage({ type: 'success', text: 'Agent created successfully!' });
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Settings</h1>
          <p className="text-gray-600">Manage your AI voice agent configuration</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Settings Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">🤖</span>
              Basic Settings
            </h2>

            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g., Dr. Smith's Assistant"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This is how your agent will introduce itself to callers
                </p>
              </div>

              {/* Agent Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-xl font-medium ${
                      agent.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Your agent is {agent.status === 'active' ? 'ready to take calls' : 'not active'}
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || agentName === agent.agent_name}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Phone Number Card */}
          {agent.phone_number && (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">📞</span>
                Phone Number
              </h2>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 font-medium mb-1">Your Agent's Phone Number</p>
                      <p className="text-3xl font-bold text-emerald-900">{agent.phone_number}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(agent.phone_number!)}
                      className="px-4 py-2 bg-white text-emerald-700 font-medium rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">How to use your phone number:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Give this number to your patients</li>
                        <li>Your AI agent will answer all calls automatically</li>
                        <li>Test it by calling the number yourself</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Token Card (Advanced) */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <span className="text-3xl mr-3">🔐</span>
              API Token
              <span className="ml-3 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-normal">
                Advanced
              </span>
            </h2>
            <p className="text-gray-600 mb-6">
              Use this token to integrate your agent with external systems
            </p>

            <div className="space-y-4">
              <button
                onClick={handleViewToken}
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all"
              >
                {showToken ? 'Hide Token' : 'Show API Token'}
              </button>

              {showToken && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Your API Token</span>
                      <button
                        onClick={() => copyToClipboard(apiToken)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Copy
                      </button>
                    </div>
                    <code className="block text-sm text-gray-800 break-all font-mono bg-white p-3 rounded border border-gray-200">
                      {apiToken}
                    </code>
                  </div>

                  <button
                    onClick={handleRegenerateToken}
                    className="w-full py-3 px-4 bg-red-50 border-2 border-red-200 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-all"
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate Token
                  </button>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Security Warning:</p>
                        <p>Keep your API token secret! If you regenerate it, your old token will stop working immediately.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent ID Info (Read-only) */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">ℹ️</span>
              Agent Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agent ID
                </label>
                <div className="flex items-center">
                  <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-mono text-sm">
                    {agent.agent_id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(agent.agent_id)}
                    className="ml-3 px-4 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadAgent();
          setMessage({ type: 'success', text: 'Agent created successfully!' });
        }}
      />
    </div>
  );
}
