import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface AgentTemplate {
  key: string;
  name: string;
  description: string;
  icon: string;
  sample_conversations: string[];
}

interface TemplateSelectStepProps {
  onSelect: (templateKey: string) => void;
  selectedTemplate?: string;
}

const TemplateSelectStep: React.FC<TemplateSelectStepProps> = ({ onSelect, selectedTemplate }) => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/templates/agent-templates');
      setTemplates(response.data.templates);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchTemplates}
          className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Choose Your Agent Template
        </h2>
        <p className="text-slate-600">
          Select a pre-configured template that matches your industry. Each template is optimized for specific use cases.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.key}
            className={`
              relative rounded-lg border-2 overflow-hidden transition-all cursor-pointer
              ${selectedTemplate === template.key
                ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                : 'border-slate-200 hover:border-emerald-300 bg-white'
              }
            `}
            onClick={() => onSelect(template.key)}
          >
            {/* Selected Checkmark */}
            {selectedTemplate === template.key && (
              <div className="absolute top-3 right-3 bg-emerald-500 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="p-6">
              {/* Icon & Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{template.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Sample Conversations */}
              <div className="mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedTemplate(expandedTemplate === template.key ? null : template.key);
                  }}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {expandedTemplate === template.key ? 'Hide' : 'Show'} Sample Conversations
                </button>

                {expandedTemplate === template.key && (
                  <div className="mt-3 space-y-2">
                    {template.sample_conversations.map((conversation, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500 mt-1">✓</span>
                        <span>{conversation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Details */}
      {selectedTemplate && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-3xl">
              {templates.find(t => t.key === selectedTemplate)?.icon}
            </div>
            <div>
              <p className="font-semibold text-emerald-900 mb-1">
                Selected: {templates.find(t => t.key === selectedTemplate)?.name}
              </p>
              <p className="text-sm text-emerald-700">
                Your agent will be pre-configured with industry-specific prompts, greetings, and best practices.
                You can customize everything after activation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> All templates can be fully customized after creation. This is just a starting point to get you up and running quickly.
        </p>
      </div>
    </div>
  );
};

export default TemplateSelectStep;
