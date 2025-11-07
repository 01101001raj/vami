import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { billingAPI } from '../services/api';
import type { Usage } from '../types';
import { CreditCard, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await billingAPI.getUsage();
        setUsage(response.data);
      } catch (error) {
        console.error('Failed to fetch usage', error);
      }
    };

    fetchUsage();
  }, []);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await billingAPI.getCustomerPortal();
      window.location.href = response.data.portal_url;
    } catch (error) {
      console.error('Failed to open customer portal', error);
      setLoading(false);
    }
  };

  // Plan features mapping
  const planFeatures = {
    starter: [
      { name: 'Up to 500 minutes/month', included: true },
      { name: 'Basic AI voice agent', included: true },
      { name: 'Email support', included: true },
      { name: 'Standard voice quality', included: true },
      { name: 'Calendar integration', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
    ],
    basic: [
      { name: 'Up to 500 minutes/month', included: true },
      { name: 'Advanced AI voice agent', included: true },
      { name: 'Email support', included: true },
      { name: 'HD voice quality', included: true },
      { name: 'Calendar integration', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
    ],
    professional: [
      { name: 'Up to 2,000 minutes/month', included: true },
      { name: 'Advanced AI voice agent', included: true },
      { name: 'Priority email support', included: true },
      { name: 'HD voice quality', included: true },
      { name: 'Calendar integration', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true },
    ],
    premium: [
      { name: 'Unlimited minutes', included: true },
      { name: 'Enterprise AI voice agent', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'Premium voice quality', included: true },
      { name: 'Calendar integration', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
  };

  const currentPlan = user?.plan || 'starter';
  const features = planFeatures[currentPlan as keyof typeof planFeatures] || planFeatures.starter;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-gradient-emerald mb-2">
          Billing & Subscription
        </h1>
        <p className="text-body text-slate-600">Manage your plan, billing, and usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user?.subscription_status === 'active'
                    ? 'bg-green-400 text-green-900'
                    : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {user?.subscription_status || 'Trial'}
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-2 capitalize">
                {currentPlan.replace('_', ' ')} Plan
              </h2>
              <p className="text-emerald-50 text-lg">
                {currentPlan === 'starter' ? '$99/month' :
                 currentPlan === 'basic' ? '$99/month' :
                 currentPlan === 'professional' ? '$500/month' : '$1,499/month'}
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{loading ? 'Loading...' : 'Manage Billing'}</span>
            </button>
          </div>

          {/* Usage Progress */}
          {usage && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-white" />
                  <span className="font-semibold text-lg">Monthly Usage</span>
                </div>
                <span className="text-2xl font-bold">
                  {usage.minutes_used.toFixed(0)} / {usage.minutes_limit} min
                </span>
              </div>
              <div className="relative">
                <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      usage.percentage_used > 90
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : usage.percentage_used > 75
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                        : 'bg-gradient-to-r from-green-400 to-emerald-400'
                    }`}
                    style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-lg">
                    {usage.percentage_used.toFixed(1)}% used
                  </span>
                </div>
              </div>
              <p className="text-emerald-50 text-sm mt-3">
                {usage.percentage_used > 90 ? (
                  'You\'re almost at your limit. Consider upgrading your plan.'
                ) : usage.percentage_used > 75 ? (
                  'You\'re using most of your monthly minutes.'
                ) : (
                  'You have plenty of minutes remaining this month.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="metric-label">Current Bill</p>
          <p className="metric-value">
            ${currentPlan === 'starter' || currentPlan === 'basic' ? '99' :
              currentPlan === 'professional' ? '500' : '1,499'}
          </p>
          <p className="text-caption text-blue-600 font-medium mt-2">Due on billing date</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="metric-label">Usage Trend</p>
          <p className="metric-value">
            {usage ? (usage.percentage_used > 50 ? '+' : '') : ''}
            {usage ? Math.round(usage.percentage_used - 50) : 0}%
          </p>
          <p className="text-caption text-primary-600 font-medium mt-2">vs last month</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="metric-label">Next Billing</p>
          <p className="metric-value">
            {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getDate()}
          </p>
          <p className="text-caption text-purple-600 font-medium mt-2">
            {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Plan Features */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-h2 text-slate-900">Your Plan Features</h2>
          <p className="text-body-sm text-slate-600 mt-1">Everything included in your {currentPlan} plan</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 p-4 rounded-xl ${
                  feature.included
                    ? 'bg-primary-50 border border-primary-100'
                    : 'bg-slate-50 border border-slate-100'
                }`}
              >
                {feature.included ? (
                  <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-body-sm font-semibold ${
                    feature.included ? 'text-primary-900' : 'text-slate-500'
                  }`}>
                    {feature.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {currentPlan !== 'premium' && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between">
              <div className="text-white max-w-xl">
                <h3 className="text-2xl font-bold mb-2">Ready to scale up?</h3>
                <p className="text-purple-100 mb-6">
                  Upgrade to a higher plan for more minutes, advanced features, and priority support.
                </p>
                <button
                  onClick={handleManageBilling}
                  className="flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 hover:bg-purple-50 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Upgrade Plan</span>
                </button>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-h2 text-slate-900">Billing History</h2>
          <p className="text-body-sm text-slate-600 mt-1">Your recent invoices and payments</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-900 font-semibold text-body-lg mb-1">No billing history yet</p>
            <p className="text-slate-500 text-body-sm">Your invoices will appear here once billing starts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
