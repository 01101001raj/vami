import React, { useState } from 'react';
import { Bot, Building2 } from 'lucide-react';

interface AgentInfoStepProps {
  onSubmit: (agentName: string, businessName: string) => void;
  onChange?: (agentName: string, businessName: string) => void;
  initialAgentName?: string;
  initialBusinessName?: string;
}

const AgentInfoStep: React.FC<AgentInfoStepProps> = ({
  onSubmit,
  onChange,
  initialAgentName = '',
  initialBusinessName = ''
}) => {
  const [agentName, setAgentName] = useState(initialAgentName);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [errors, setErrors] = useState<{ agentName?: string; businessName?: string }>({});

  // Update parent state in real-time so the Continue button works
  React.useEffect(() => {
    if (onChange) {
      onChange(agentName, businessName);
    }
  }, [agentName, businessName, onChange]);

  const validateForm = () => {
    const newErrors: { agentName?: string; businessName?: string } = {};

    if (!agentName.trim()) {
      newErrors.agentName = 'Agent name is required';
    } else if (agentName.length < 2) {
      newErrors.agentName = 'Agent name must be at least 2 characters';
    }

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (businessName.length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateForm()) {
      onSubmit(agentName.trim(), businessName.trim());
    }
  };

  // Auto-submit when both fields are valid
  React.useEffect(() => {
    if (agentName.trim() && businessName.trim() &&
        agentName.length >= 2 && businessName.length >= 2) {
      // Don't auto-submit, let user click continue
    }
  }, [agentName, businessName]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Tell Us About Your Agent
        </h2>
        <p className="text-slate-600">
          Provide basic information about your AI agent and business. You can change these details later.
        </p>
      </div>

      <div className="space-y-6 bg-white rounded-lg border border-slate-200 p-6">
        {/* Agent Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-600" />
              Agent Name
            </div>
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => {
              setAgentName(e.target.value);
              if (errors.agentName) setErrors({ ...errors, agentName: undefined });
            }}
            placeholder="e.g., Sarah, Dr. Smith's Assistant, Reception Bot"
            className={`
              w-full px-4 py-3 rounded-lg border
              ${errors.agentName ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'}
              focus:outline-none focus:ring-2 focus:border-transparent
            `}
          />
          {errors.agentName && (
            <p className="mt-1 text-sm text-red-600">{errors.agentName}</p>
          )}
          <p className="mt-2 text-sm text-slate-500">
            This is how your agent will introduce itself to callers.
          </p>
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Business Name
            </div>
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (errors.businessName) setErrors({ ...errors, businessName: undefined });
            }}
            placeholder="e.g., Smith Medical Clinic, Johnson Law Firm"
            className={`
              w-full px-4 py-3 rounded-lg border
              ${errors.businessName ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500'}
              focus:outline-none focus:ring-2 focus:border-transparent
            `}
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
          )}
          <p className="mt-2 text-sm text-slate-500">
            Your business or practice name that the agent represents.
          </p>
        </div>

        {/* Preview */}
        {agentName && businessName && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-medium text-emerald-900 mb-2">Preview:</p>
            <p className="text-slate-700 italic">
              "Thank you for calling {businessName}. This is {agentName}, how may I help you today?"
            </p>
          </div>
        )}
      </div>

      {/* Example Names */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-2">Examples:</p>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <span className="text-emerald-600">•</span>
            <span><strong>Agent:</strong> Sarah | <strong>Business:</strong> Smith Family Dentistry</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600">•</span>
            <span><strong>Agent:</strong> Legal Assistant | <strong>Business:</strong> Johnson & Associates Law</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-600">•</span>
            <span><strong>Agent:</strong> Alex | <strong>Business:</strong> Premier Real Estate Group</span>
          </div>
        </div>
      </div>

      {/* Hidden submit button for form */}
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
};

export default AgentInfoStep;
