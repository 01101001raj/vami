import React from 'react';
import { Phone, Bot, Building2, FileText, CheckCircle2 } from 'lucide-react';

interface ConfirmationStepProps {
  phoneNumber: string;
  agentName: string;
  businessName: string;
  templateKey: string;
  templateName: string;
  templateIcon: string;
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  phoneNumber,
  agentName,
  businessName,
  templateKey,
  templateName,
  templateIcon,
  onConfirm,
  loading = false
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Review & Activate Your Agent
        </h2>
        <p className="text-slate-600">
          Please review your configuration. Once activated, your agent will be live and ready to take calls.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Phone Number */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Phone className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Phone Number</h3>
              <p className="text-lg text-slate-700 font-mono">{phoneNumber}</p>
              <p className="text-sm text-slate-500 mt-1">
                Callers will reach your agent at this number
              </p>
            </div>
          </div>
        </div>

        {/* Agent Name */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Bot className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Agent Name</h3>
              <p className="text-lg text-slate-700">{agentName}</p>
              <p className="text-sm text-slate-500 mt-1">
                How your agent will introduce itself
              </p>
            </div>
          </div>
        </div>

        {/* Business Name */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Business Name</h3>
              <p className="text-lg text-slate-700">{businessName}</p>
              <p className="text-sm text-slate-500 mt-1">
                Your business or practice name
              </p>
            </div>
          </div>
        </div>

        {/* Template */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg text-2xl">
              {templateIcon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Template</h3>
              <p className="text-lg text-slate-700">{templateName}</p>
              <p className="text-sm text-slate-500 mt-1">
                Pre-configured for your industry
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Greeting Preview */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-3">
          <FileText className="w-5 h-5 text-emerald-600 mt-1" />
          <h3 className="font-semibold text-emerald-900">Sample Greeting</h3>
        </div>
        <p className="text-slate-700 italic pl-8">
          "Thank you for calling {businessName}. This is {agentName}, how may I help you today?"
        </p>
      </div>

      {/* What Happens Next */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h3 className="font-semibold text-blue-900 mb-3">What happens after activation:</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Your agent will be <strong>immediately live</strong> and ready to receive calls
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Calls to <strong>{phoneNumber}</strong> will be answered by your AI agent
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              You can customize all settings from your dashboard at any time
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              View call logs, analytics, and performance metrics in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Activation Button */}
      <div className="pt-4">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Activating Your Agent...
            </span>
          ) : (
            'Activate Agent & Go Live'
          )}
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        By activating, you confirm that the information above is correct.
      </p>
    </div>
  );
};

export default ConfirmationStep;
