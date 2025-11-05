import { useEffect, useState } from 'react';
import { Phone, Clock, TrendingUp, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { billingAPI, agentAPI, analyticsAPI } from '../services/api';
import type { Usage, Agent } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usageRes, agentRes, statsRes] = await Promise.all([
          billingAPI.getUsage(),
          agentAPI.getAgent(),
          analyticsAPI.getStats(7),
        ]);
        setUsage(usageRes.data);
        setAgent(agentRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.company_name || user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Calls</p>
              <p className="text-3xl font-bold mt-2">{stats?.total_conversations || 0}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Phone className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Minutes Used</p>
              <p className="text-3xl font-bold mt-2">
                {usage?.minutes_used.toFixed(0) || 0}
                <span className="text-lg text-gray-500">/{usage?.minutes_limit || 0}</span>
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          {usage && (
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-3xl font-bold mt-2">
                {stats ? Math.round((stats.successful_calls / (stats.total_conversations || 1)) * 100) : 0}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Appointments</p>
              <p className="text-3xl font-bold mt-2">{stats?.appointments_booked || 0}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Agent</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Agent Name:</span>
            <span className="font-medium">{agent?.agent_name || 'Loading...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              agent?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {agent?.status || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium capitalize">{user?.plan.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary">
            Upload Knowledge Base
          </button>
          <button className="btn btn-secondary">
            Connect Calendar
          </button>
          <button className="btn btn-secondary">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
