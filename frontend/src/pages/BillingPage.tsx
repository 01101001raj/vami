import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { billingAPI } from '../services/api';
import type { Usage } from '../types';

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="mt-2 text-gray-600">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-lg capitalize">{user?.plan.replace('_', ' ')}</p>
              <p className="text-sm text-gray-600">Status: <span className="capitalize">{user?.subscription_status}</span></p>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Loading...' : 'Manage Billing'}
            </button>
          </div>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Usage This Month</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Minutes Used</span>
                <span className="font-medium">
                  {usage.minutes_used.toFixed(1)} / {usage.minutes_limit}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    usage.percentage_used > 80 ? 'bg-red-600' : 'bg-primary-600'
                  }`}
                  style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {usage.percentage_used.toFixed(1)}% used
              </p>
            </div>

            {usage.percentage_used > 80 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  You're approaching your monthly limit. Consider upgrading your plan to avoid service interruption.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Plan Features</h2>
        <div className="grid grid-cols-2 gap-4">
          {user?.features && Object.entries(user.features).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
              <span className="text-sm font-medium">
                {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
