import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import AgentInfoStep from './AgentInfoStep';
import TemplateSelectStep from './TemplateSelectStep';
import ConfirmationStep from './ConfirmationStep';
import api from '../../services/api';

interface OnboardingData {
  phoneNumber: string;
  phoneSid: string;
  agentName: string;
  businessName: string;
  templateKey: string;
  templateName?: string;
  templateIcon?: string;
}

const STEPS = [
  { number: 1, title: 'Agent Info', description: 'Name & business' },
  { number: 2, title: 'Template', description: 'Select type' },
  { number: 3, title: 'Confirm', description: 'Review & activate' },
];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    phoneNumber: '+1234567890', // Dummy phone number for testing
    phoneSid: 'dummy_sid_' + Date.now(),
    agentName: '',
    businessName: '',
    templateKey: '',
  });

  // Allow access to onboarding even if agent exists (for updates)
  useEffect(() => {
    setCheckingAccess(false);
  }, []);

  // Step 1: Agent Info
  const handleAgentInfoSubmit = (agentName: string, businessName: string) => {
    setOnboardingData({ ...onboardingData, agentName, businessName });
    setCurrentStep(2);
  };

  // Step 2: Template Selection
  const handleTemplateSelect = async (templateKey: string) => {
    try {
      // Fetch template details to get name and icon
      const response = await api.get(`/templates/agent-templates/${templateKey}`);
      setOnboardingData({
        ...onboardingData,
        templateKey,
        templateName: response.data.name,
        templateIcon: response.data.icon,
      });
    } catch (err) {
      console.error('Failed to fetch template details:', err);
      setOnboardingData({ ...onboardingData, templateKey });
    }
  };

  // Step 3: Confirmation & Activation
  const handleActivation = async () => {
    try {
      setLoading(true);
      setError('');

      let agentId: string;

      try {
        // Try to create the agent with template-based AI prompt and dummy phone number
        const agentResponse = await api.post('/agents/', {
          agent_name: onboardingData.agentName,
          template_key: onboardingData.templateKey,
          business_name: onboardingData.businessName,
          phone_number: onboardingData.phoneNumber, // Using dummy number
        });

        agentId = agentResponse.data.agent_id;
      } catch (createError: any) {
        // If agent already exists (400 error), get existing agent and update it
        if (createError.response?.status === 400 && createError.response?.data?.detail?.includes('already has an agent')) {
          // Agent already exists, update instead

          // Get existing agent
          const existingAgentResponse = await api.get('/agents/');
          agentId = existingAgentResponse.data.agent_id;

          // Update the existing agent
          await api.put(`/agents/${agentId}`, {
            agent_name: onboardingData.agentName,
            // Note: template_key cannot be changed after creation
            // phone_number and business_name are stored but may not be updatable
          });
        } else {
          // Re-throw other errors
          throw createError;
        }
      }

      // Success! Navigate to welcome page
      navigate('/welcome', {
        state: {
          agentId: agentId,
          agentName: onboardingData.agentName,
          businessName: onboardingData.businessName,
          phoneNumber: onboardingData.phoneNumber,
        },
      });
    } catch (err: any) {
      console.error('Activation failed:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to activate agent. Please try again or contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.agentName && onboardingData.businessName;
      case 2:
        return onboardingData.templateKey;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Step 1 (Agent Info) has its own submit button
      return;
    }
    if (currentStep < 3 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to Vami</h1>
          <p className="text-slate-600 mt-1">Let's get your AI agent set up in 4 simple steps</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-12">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all
                    ${currentStep > step.number
                      ? 'bg-emerald-500 text-white'
                      : currentStep === step.number
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                      : 'bg-slate-200 text-slate-500'
                    }
                  `}
                >
                  {currentStep > step.number ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    step.number
                  )}
                </div>
                {/* Label */}
                <div className="mt-2 text-center">
                  <div
                    className={`
                      text-sm font-medium
                      ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'}
                    `}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-2 rounded transition-all -mt-10
                    ${currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 min-h-[500px]">
          {currentStep === 1 && (
            <AgentInfoStep
              onSubmit={handleAgentInfoSubmit}
              onChange={(agentName, businessName) => {
                setOnboardingData({ ...onboardingData, agentName, businessName });
              }}
              initialAgentName={onboardingData.agentName}
              initialBusinessName={onboardingData.businessName}
            />
          )}

          {currentStep === 2 && (
            <TemplateSelectStep
              onSelect={handleTemplateSelect}
              selectedTemplate={onboardingData.templateKey}
            />
          )}

          {currentStep === 3 && (
            <ConfirmationStep
              phoneNumber={onboardingData.phoneNumber}
              agentName={onboardingData.agentName}
              businessName={onboardingData.businessName}
              templateKey={onboardingData.templateKey}
              templateName={onboardingData.templateName || 'Selected Template'}
              templateIcon={onboardingData.templateIcon || '🤖'}
              onConfirm={handleActivation}
              loading={loading}
            />
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-3 text-slate-600 hover:text-slate-900 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>

            {currentStep !== 1 && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {currentStep === 2 ? 'Review' : 'Continue'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {currentStep === 1 && (
              <button
                onClick={() => {
                  // Directly move to next step if both fields are filled
                  const hasAgentName = onboardingData.agentName && onboardingData.agentName.trim().length >= 2;
                  const hasBusinessName = onboardingData.businessName && onboardingData.businessName.trim().length >= 2;

                  if (hasAgentName && hasBusinessName) {
                    setCurrentStep(2);
                  }
                }}
                disabled={
                  !onboardingData.agentName ||
                  !onboardingData.businessName ||
                  onboardingData.agentName.trim().length < 2 ||
                  onboardingData.businessName.trim().length < 2
                }
                className="px-8 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
