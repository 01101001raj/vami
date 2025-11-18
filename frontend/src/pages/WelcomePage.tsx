import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Phone, Building2, Bot, ArrowRight } from 'lucide-react';

interface WelcomeState {
  agentId: string;
  agentName: string;
  businessName: string;
  phoneNumber: string;
}

export default function WelcomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as WelcomeState;

  useEffect(() => {
    // If no state, redirect to dashboard
    if (!state || !state.agentId) {
      navigate('/dashboard');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-2xl shadow-emerald-500/50 mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Welcome to VAMI! 🎉
          </h1>
          <p className="text-xl text-slate-600">
            Your AI voice agent is now <span className="font-semibold text-emerald-600">live and ready</span> to handle calls!
          </p>
        </div>

        {/* Agent Details Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Your Agent is Active</h2>
            <p className="text-emerald-50 mt-1">All systems are go! Your agent is ready to answer calls 24/7.</p>
          </div>

          <div className="p-8 space-y-6">
            {/* Agent Name */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Bot className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Agent Name</h3>
                <p className="text-lg text-slate-700">{state.agentName}</p>
              </div>
            </div>

            {/* Business Name */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Business</h3>
                <p className="text-lg text-slate-700">{state.businessName}</p>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Phone Number</h3>
                <p className="text-lg text-slate-700 font-mono">{state.phoneNumber}</p>
                <p className="text-sm text-slate-500 mt-1">Calls to this number are now being answered by your AI agent</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-4 text-lg">What happens now?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                <strong>Instant Response:</strong> Your agent is live right now and will answer every incoming call
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                <strong>24/7 Availability:</strong> Never miss a call again - your agent works around the clock
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                <strong>Real-time Analytics:</strong> View call logs, transcripts, and performance metrics in your dashboard
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                <strong>Easy Customization:</strong> Update your agent's settings, knowledge base, and responses anytime
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
          >
            Go to Dashboard
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* Test Call Suggestion */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-3">
            Want to test it out? Call <span className="font-mono font-bold text-emerald-600">{state.phoneNumber}</span> right now!
          </p>
          <p className="text-sm text-slate-500">
            Your agent will answer and guide you through the conversation
          </p>
        </div>
      </div>
    </div>
  );
}
