import { useEffect, useState } from 'react';
import { Phone, Clock, TrendingUp, Calendar, Upload, BarChart3, Settings } from 'lucide-react';
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.company_name || user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Calls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
              <Phone className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="px-2.5 py-1 bg-emerald-50 rounded-lg">
              <span className="text-xs font-semibold text-emerald-600">+12%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.total_conversations || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
        </div>

        {/* Minutes Used */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="px-2.5 py-1 bg-blue-50 rounded-lg">
              <span className="text-xs font-semibold text-blue-600">{usage?.percentage_used.toFixed(0) || 0}%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Minutes Used</p>
          <p className="text-3xl font-bold text-gray-900">
            {usage?.minutes_used.toFixed(0) || 0}
            <span className="text-lg text-gray-400 ml-1">/{usage?.minutes_limit || 0}</span>
          </p>
          {usage && (
            <div className="mt-3">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="px-2.5 py-1 bg-green-50 rounded-lg">
              <span className="text-xs font-semibold text-green-600">+5%</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats ? Math.round((stats.successful_calls / (stats.total_conversations || 1)) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-2">Calls completed</p>
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="px-2.5 py-1 bg-purple-50 rounded-lg">
              <span className="text-xs font-semibold text-purple-600">+8</span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Appointments</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.appointments_booked || 0}</p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your AI Agent</h2>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              agent?.status === 'active'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {agent?.status === 'active' ? '● Active' : '○ Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Agent Name</p>
              <p className="text-base font-semibold text-gray-900">{agent?.agent_name || 'Loading...'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Plan</p>
              <p className="text-base font-semibold text-gray-900 capitalize">
                {user?.plan.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Subscription</p>
              <p className="text-base font-semibold text-gray-900 capitalize">
                {user?.subscription_status}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-emerald-800">Agent Performance</h3>
                <p className="mt-1 text-sm text-emerald-700">
                  Your AI agent is performing well with a {stats ? Math.round((stats.successful_calls / (stats.total_conversations || 1)) * 100) : 0}% success rate. Keep up the good work!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="font-semibold">Upload Knowledge</span>
              </div>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Connect Calendar</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-semibold text-gray-900">View Analytics</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-semibold text-gray-900">Agent Settings</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Successful call completed</p>
              <p className="text-sm text-gray-600">Appointment booked with John Doe</p>
              <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
            </div>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Success</span>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Calendar sync completed</p>
              <p className="text-sm text-gray-600">3 appointments synchronized</p>
              <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">Sync</span>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Usage milestone reached</p>
              <p className="text-sm text-gray-600">You've completed 100 calls this month</p>
              <p className="text-xs text-gray-500 mt-1">1 day ago</p>
            </div>
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">Milestone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
