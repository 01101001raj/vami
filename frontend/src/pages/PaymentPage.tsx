import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft } from 'lucide-react';
import api from '../services/api';

interface PaymentState {
  plan: string;
  planName: string;
  priceId: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentState;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If no state, redirect back to pricing
    if (!state || !state.plan) {
      navigate('/pricing');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Call backend to create Stripe checkout session
      const response = await api.post('/billing/create-checkout-session', {
        price_id: state.priceId,
        plan: state.plan,
        billing_cycle: state.billingCycle,
      });

      if (response.data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to process payment. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // TODO: Remove this in production
    // For testing, allow skipping directly to onboarding
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Plans
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Purchase</h1>
          <p className="text-slate-600 mt-1">You're one step away from your AI voice agent</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h2>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              {/* Plan Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{state.planName} Plan</h3>
                <p className="text-sm text-slate-600">
                  Billed {state.billingCycle === 'monthly' ? 'Monthly' : 'Annually'}
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex justify-between text-slate-700">
                  <span>{state.planName} Plan</span>
                  <span>${state.amount}</span>
                </div>
                {state.billingCycle === 'yearly' && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Annual discount</span>
                    <span>17% off</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between text-lg font-bold text-slate-900">
                  <span>Total</span>
                  <span>${state.amount}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {state.billingCycle === 'monthly'
                    ? 'Billed monthly. Cancel anytime.'
                    : `Billed annually at $${state.amount}/year. Save $${Math.round((state.amount / 0.83 - state.amount))}/year.`
                  }
                </p>
              </div>

              {/* What's Included */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">What's included:</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  {state.plan === 'basic' && (
                    <>
                      <li>✓ 1 AI Voice Agent</li>
                      <li>✓ 500 minutes/month</li>
                      <li>✓ Basic analytics</li>
                    </>
                  )}
                  {state.plan === 'advanced' && (
                    <>
                      <li>✓ 3 AI Voice Agents</li>
                      <li>✓ 2,000 minutes/month</li>
                      <li>✓ Advanced analytics</li>
                      <li>✓ Priority support</li>
                    </>
                  )}
                  {state.plan === 'premium' && (
                    <>
                      <li>✓ Unlimited AI Voice Agents</li>
                      <li>✓ 10,000 minutes/month</li>
                      <li>✓ Enterprise analytics</li>
                      <li>✓ 24/7 Priority support</li>
                      <li>✓ Dedicated account manager</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Method</h2>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Secure Payment Badge */}
              <div className="flex items-center gap-2 mb-6 text-sm text-slate-600">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Secure payment powered by Stripe</span>
              </div>

              {/* Stripe Checkout Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Secure Checkout
                  </>
                )}
              </button>

              {/* Info Text */}
              <div className="mt-6 space-y-3 text-xs text-slate-500">
                <p>
                  • You'll be redirected to Stripe's secure checkout page
                </p>
                <p>
                  • After payment, you'll return to complete agent setup
                </p>
                <p>
                  • Cancel anytime from your billing settings
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-center gap-6 text-slate-400">
                  <div className="flex items-center gap-1 text-xs">
                    <Lock className="w-3 h-3" />
                    SSL Secure
                  </div>
                  <div className="text-xs">•</div>
                  <div className="text-xs">Powered by Stripe</div>
                  <div className="text-xs">•</div>
                  <div className="text-xs">PCI Compliant</div>
                </div>
              </div>
            </div>

            {/* Skip Button - FOR TESTING ONLY */}
            <div className="mt-6 text-center">
              <button
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-700 underline text-sm"
              >
                Skip payment (Testing Mode)
              </button>
              <p className="text-xs text-slate-400 mt-1">
                ⚠️ This button will be removed in production
              </p>
            </div>
          </div>
        </div>

        {/* Money-back Guarantee */}
        <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
          <h3 className="font-bold text-blue-900 mb-2">30-Day Money-Back Guarantee</h3>
          <p className="text-blue-800 text-sm">
            Try VAMI risk-free. If you're not satisfied within 30 days, we'll refund your purchase—no questions asked.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
