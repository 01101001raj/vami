import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { agentAPI } from '../../services/api';

interface CreateAgentStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

interface AgentForm {
  agentName: string;
  language: string;
  personality: string;
  voiceType: string;
  capabilities: string[];
}

export default function CreateAgentStep({ data, onNext, onBack }: CreateAgentStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<'female' | 'male' | 'neutral'>('female');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    'appointments',
    'reminders'
  ]);

  const { register, handleSubmit, formState: { errors } } = useForm<AgentForm>({
    defaultValues: {
      agentName: data.agentName || `${data.practiceType || 'Practice'} Assistant`,
      language: data.language || 'en',
      personality: data.personality || 'warm_caring',
      voiceType: data.voiceType || 'female'
    }
  });

  const capabilities = [
    { id: 'appointments', label: 'Appointment Booking', icon: '📅' },
    { id: 'reminders', label: 'Appointment Reminders', icon: '🔔' },
    { id: 'insurance', label: 'Insurance Questions', icon: '💳' },
    { id: 'information', label: 'General Practice Information', icon: 'ℹ️' },
    { id: 'prescriptions', label: 'Prescription Refills', icon: '💊' },
    { id: 'emergency', label: 'Emergency Triage', icon: '🚨' }
  ];

  const toggleCapability = (capId: string) => {
    setSelectedCapabilities(prev =>
      prev.includes(capId)
        ? prev.filter(c => c !== capId)
        : [...prev, capId]
    );
  };

  const onSubmit = async (formData: AgentForm) => {
    try {
      setIsLoading(true);
      setError('');

      // Create agent via API
      const response = await agentAPI.createAgent({
        agent_name: formData.agentName,
        language: formData.language,
        personality: formData.personality,
        voice_type: selectedVoice,
        capabilities: selectedCapabilities,
        provision_phone: false // We'll do this in next step
      });

      // Pass agent data to next step
      onNext({
        agentId: response.data.agent_id,
        agentName: formData.agentName,
        language: formData.language,
        personality: formData.personality,
        voiceType: selectedVoice,
        capabilities: selectedCapabilities
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your AI Agent
          </h2>
          <p className="text-gray-600">
            Configure your AI assistant that will answer calls and help your patients
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Agent Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              {...register('agentName', { required: 'Agent name is required' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Smith Dental Assistant"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              This is how your agent will identify itself to callers
            </p>
            {errors.agentName && (
              <p className="mt-1.5 text-sm text-red-600">{errors.agentName.message}</p>
            )}
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Language
            </label>
            <select
              {...register('language')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="en">English (US)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Agent Personality
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-all">
                <input
                  type="radio"
                  value="professional_friendly"
                  {...register('personality')}
                  className="w-5 h-5 text-emerald-600"
                />
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">Professional & Friendly</div>
                  <div className="text-sm text-gray-600">Balanced tone, suitable for most practices</div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-emerald-500 bg-emerald-50 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  value="warm_caring"
                  {...register('personality')}
                  className="w-5 h-5 text-emerald-600"
                  defaultChecked
                />
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">Warm & Caring</div>
                  <div className="text-sm text-emerald-700">
                    Empathetic and reassuring (Recommended for healthcare)
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-all">
                <input
                  type="radio"
                  value="efficient_brief"
                  {...register('personality')}
                  className="w-5 h-5 text-emerald-600"
                />
                <div className="ml-3">
                  <div className="font-semibold text-gray-900">Efficient & Brief</div>
                  <div className="text-sm text-gray-600">Quick and to-the-point responses</div>
                </div>
              </label>
            </div>
          </div>

          {/* Voice Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Voice Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedVoice('female')}
                className={`flex-1 p-4 border-2 rounded-xl transition-all
                  ${selectedVoice === 'female'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                  }`}
              >
                <div className="text-2xl mb-2">👩</div>
                <div className="font-semibold">Female</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVoice('male')}
                className={`flex-1 p-4 border-2 rounded-xl transition-all
                  ${selectedVoice === 'male'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                  }`}
              >
                <div className="text-2xl mb-2">👨</div>
                <div className="font-semibold">Male</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVoice('neutral')}
                className={`flex-1 p-4 border-2 rounded-xl transition-all
                  ${selectedVoice === 'neutral'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                  }`}
              >
                <div className="text-2xl mb-2">🎭</div>
                <div className="font-semibold">Neutral</div>
              </button>
            </div>

            <button
              type="button"
              className="mt-3 px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              Preview Voice
            </button>
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What should your agent help with?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {capabilities.map((cap) => (
                <label
                  key={cap.id}
                  className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${selectedCapabilities.includes(cap.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCapabilities.includes(cap.id)}
                    onChange={() => toggleCapability(cap.id)}
                    className="w-5 h-5 text-emerald-600 rounded mt-0.5"
                  />
                  <div className="ml-3">
                    <div className="text-lg mb-1">{cap.icon}</div>
                    <div className="font-medium text-sm text-gray-900">{cap.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              ← Back
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating your agent...
                </>
              ) : (
                <>
                  Create Agent
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
