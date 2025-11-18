import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import BusinessInfoStep from './BusinessInfoStep';
// import PricingStep from './PricingStep';
import CreateAgentStep from './CreateAgentStep';
// import PhoneNumberStep from './PhoneNumberStep';
// import TestAgentStep from './TestAgentStep';

interface OnboardingData {
  // Business Info
  practiceType?: string;
  phoneNumber?: string;
  address?: string;
  hoursOpen?: string;
  hoursClose?: string;
  timezone?: string;

  // Pricing
  selectedPlan?: string;
  stripeSessionId?: string;

  // Agent
  agentId?: string;
  agentName?: string;
  language?: string;
  personality?: string;
  voiceType?: string;
  capabilities?: string[];

  // Phone Number
  areaCode?: string;
  phoneNumberAssigned?: string;
  phoneNumberSid?: string;
}

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const totalSteps = 5;

  const updateData = (newData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Onboarding complete - go to dashboard
      navigate('/dashboard');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const steps = [
    'Business Info',
    'Choose Plan',
    'Create Agent',
    'Phone Number',
    'Test & Launch'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to Vami
            </h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all
                        ${isActive ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : ''}
                        ${isCompleted ? 'bg-emerald-600 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        stepNumber
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium text-center
                        ${isActive ? 'text-emerald-600' : ''}
                        ${isCompleted ? 'text-emerald-600' : ''}
                        ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                      `}
                    >
                      {step}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all
                        ${stepNumber < currentStep ? 'bg-emerald-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentStep === 1 && (
          <div className="text-center p-8">
            <p className="text-gray-600">Business Info Step - To be implemented</p>
            <button onClick={nextStep} className="btn btn-primary mt-4">Continue</button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center p-8">
            <p className="text-gray-600">Pricing Step - To be implemented</p>
            <button onClick={nextStep} className="btn btn-primary mt-4">Continue</button>
            <button onClick={prevStep} className="btn btn-secondary mt-4 ml-2">Back</button>
          </div>
        )}

        {currentStep === 3 && (
          <CreateAgentStep
            data={onboardingData}
            onNext={(data: any) => {
              updateData(data);
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {currentStep === 4 && (
          <div className="text-center p-8">
            <p className="text-gray-600">Phone Number Step - To be implemented</p>
            <button onClick={nextStep} className="btn btn-primary mt-4">Continue</button>
            <button onClick={prevStep} className="btn btn-secondary mt-4 ml-2">Back</button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="text-center p-8">
            <p className="text-gray-600">Test Agent Step - To be implemented</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">Finish</button>
            <button onClick={prevStep} className="btn btn-secondary mt-4 ml-2">Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
