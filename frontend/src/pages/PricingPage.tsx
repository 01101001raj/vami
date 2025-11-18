import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Building2, Sparkles, Star, TrendingUp, Shield, Award, Rocket, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  iconColor: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  priceId: {
    monthly: string;
    yearly: string;
  };
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Starter',
    icon: <Zap className="w-7 h-7" />,
    iconColor: 'text-blue-600',
    description: 'Perfect for small businesses getting started',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      '1 AI Voice Agent',
      '500 minutes/month',
      'Basic phone number',
      'Real-time analytics',
      'Email support',
      'Knowledge base (5 docs)',
    ],
    priceId: {
      monthly: 'price_basic_monthly',
      yearly: 'price_basic_yearly',
    },
  },
  {
    id: 'advanced',
    name: 'Professional',
    icon: <Crown className="w-7 h-7" />,
    iconColor: 'text-purple-600',
    description: 'For growing businesses with higher call volume',
    monthlyPrice: 79,
    yearlyPrice: 790,
    popular: true,
    features: [
      '3 AI Voice Agents',
      '2,000 minutes/month',
      'Premium phone numbers',
      'Advanced analytics & AI insights',
      'Priority support (24/7)',
      'Knowledge base (20 docs)',
      'Custom prompts & personality',
      'Calendar integration',
    ],
    priceId: {
      monthly: 'price_advanced_monthly',
      yearly: 'price_advanced_yearly',
    },
  },
  {
    id: 'premium',
    name: 'Enterprise',
    icon: <Building2 className="w-7 h-7" />,
    iconColor: 'text-emerald-600',
    description: 'Enterprise-grade solution for large teams',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      'Unlimited AI Voice Agents',
      '10,000 minutes/month',
      'Premium phone numbers',
      'Enterprise analytics & reports',
      'Dedicated account manager',
      'Unlimited knowledge base',
      'Custom integrations & API',
      'Advanced calendar sync',
      'CRM integration',
      'White-label options',
    ],
    priceId: {
      monthly: 'price_premium_monthly',
      yearly: 'price_premium_yearly',
    },
  },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (plan: Plan) => {
    const priceId = billingCycle === 'monthly' ? plan.priceId.monthly : plan.priceId.yearly;
    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

    navigate('/payment', {
      state: {
        plan: plan.id,
        planName: plan.name,
        priceId: priceId,
        amount: amount,
        billingCycle: billingCycle,
      },
    });
  };

  const handleSkip = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Premium Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-transparent to-teal-50/40 pointer-events-none"></div>

      {/* Content */}
      <div className="relative">
        {/* Hero Header */}
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Special Offer - Save 17% on Annual Plans</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choose the perfect plan for your business. Upgrade or downgrade anytime.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>30-day money back</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-600" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-16 px-4">
          <div className="relative inline-flex p-1 bg-gray-100 rounded-xl shadow-sm">
            {/* Sliding Background */}
            <div
              className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-md transition-all duration-300 ${
                billingCycle === 'yearly' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
              }`}
            ></div>

            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative z-10 px-8 py-3 rounded-lg font-semibold text-base transition-colors duration-200 ${
                billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative z-10 px-8 py-3 rounded-lg font-semibold text-base transition-colors duration-200 ${
                billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  plan.popular
                    ? 'border-emerald-500 md:-mt-4'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-current" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className={`inline-flex p-3 bg-gray-50 rounded-xl mb-4 ${plan.iconColor}`}>
                    {plan.icon}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-5xl font-black text-gray-900">
                        ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      </span>
                      <span className="text-gray-600 text-lg font-medium">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        <span>${Math.round(plan.yearlyPrice / 12)}/month when billed annually</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="bg-gradient-to-br from-gray-50 to-emerald-50 rounded-3xl p-12 border border-gray-200 shadow-xl">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-black text-gray-900 mb-3">
                Trusted by 1,000+ businesses worldwide
              </h3>
              <p className="text-gray-600 text-lg">Join companies who never miss a call</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="text-5xl mb-4">🚀</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Lightning Fast Setup</h4>
                <p className="text-gray-600 text-sm">Get your AI agent live in under 5 minutes with our intuitive setup wizard</p>
              </div>

              <div className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="text-5xl mb-4">📞</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">24/7 Availability</h4>
                <p className="text-gray-600 text-sm">Your AI never sleeps. Handle calls around the clock, even during holidays</p>
              </div>

              <div className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="text-5xl mb-4">📊</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Smart Analytics</h4>
                <p className="text-gray-600 text-sm">Get actionable insights with AI-powered analytics and call transcripts</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h3 className="text-3xl font-black text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Can I change plans later?</h4>
              <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <h4 className="text-lg font-bold text-gray-900 mb-2">What happens if I exceed my minutes?</h4>
              <p className="text-gray-600">We'll send you a notification when you're close to your limit. You can upgrade your plan or purchase additional minutes as needed.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Is there a setup fee?</h4>
              <p className="text-gray-600">No setup fees, no hidden charges. What you see is what you pay. We believe in transparent pricing.</p>
            </div>
          </div>
        </div>

        {/* Skip Button - Testing */}
        <div className="text-center pb-12">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-emerald-600 text-sm transition-colors duration-200"
          >
            <span className="underline">Skip for now</span>
            <span className="text-xs ml-2 opacity-50">(Testing)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
