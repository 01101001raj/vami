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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-gradient-emerald mb-2">
          Dashboard
        </h1>
        <p className="text-body text-slate-600">Welcome back, {user?.company_name || user?.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Calls */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <Phone className="w-6 h-6 text-primary-600" />
            </div>
            <span className="badge badge-success">+12%</span>
          </div>
          <p className="metric-label">Total Calls</p>
          <p className="metric-value">{stats?.total_conversations || 0}</p>
          <p className="text-caption text-slate-500 mt-2">Last 7 days</p>
        </div>

        {/* Minutes Used */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="badge badge-info">{usage?.percentage_used.toFixed(0) || 0}%</span>
          </div>
          <p className="metric-label">Minutes Used</p>
          <p className="metric-value">
            {usage?.minutes_used.toFixed(0) || 0}
            <span className="text-lg text-slate-400 ml-1">/{usage?.minutes_limit || 0}</span>
          </p>
          {usage && (
            <div className="mt-4">
              <div className="progress-bar h-2">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Success Rate */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
            <span className="badge badge-success">+5%</span>
          </div>
          <p className="metric-label">Success Rate</p>
          <p className="metric-value">
            {stats ? Math.round((stats.successful_calls / (stats.total_conversations || 1)) * 100) : 0}%
          </p>
          <p className="text-caption text-slate-500 mt-2">Calls completed</p>
        </div>

        {/* Appointments */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="badge badge-warning">+8</span>
          </div>
          <p className="metric-label">Appointments</p>
          <p className="metric-value">{stats?.appointments_booked || 0}</p>
          <p className="text-caption text-slate-500 mt-2">This month</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status - Takes 2 columns */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-slate-900">Your AI Agent</h2>
            <span className={agent?.status === 'active' ? 'badge badge-success' : 'badge badge-neutral'}>
              {agent?.status === 'active' ? '● Active' : '○ Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-body-sm text-slate-500">Agent Name</p>
              <p className="text-body font-semibold text-slate-900">{agent?.agent_name || 'Loading...'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-body-sm text-slate-500">Plan</p>
              <p className="text-body font-semibold text-slate-900 capitalize">
                {user?.plan.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-body-sm text-slate-500">Subscription</p>
              <p className="text-body font-semibold text-slate-900 capitalize">
                {user?.subscription_status}
              </p>
            </div>
          </div>

          <div className="alert alert-success mt-6">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold">Agent Performance</h3>
              <p className="mt-1 text-sm">
                Your AI agent is performing well with a {stats ? Math.round((stats.successful_calls / (stats.total_conversations || 1)) * 100) : 0}% success rate. Keep up the good work!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-h2 text-slate-900 mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <button className="btn btn-primary w-full justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Upload className="w-5 h-5" />
                </div>
                <span>Upload Knowledge</span>
              </div>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="btn btn-secondary w-full justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span>Connect Calendar</span>
              </div>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="btn btn-secondary w-full justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <span>View Analytics</span>
              </div>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="btn btn-secondary w-full justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <span>Agent Settings</span>
              </div>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-h2 text-slate-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-slate-900">Successful call completed</p>
              <p className="text-body-sm text-slate-600">Appointment booked with John Doe</p>
              <p className="text-caption text-slate-500 mt-1">2 hours ago</p>
            </div>
            <span className="badge badge-success">Success</span>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-slate-900">Calendar sync completed</p>
              <p className="text-body-sm text-slate-600">3 appointments synchronized</p>
              <p className="text-caption text-slate-500 mt-1">5 hours ago</p>
            </div>
            <span className="badge badge-info">Sync</span>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-slate-900">Usage milestone reached</p>
              <p className="text-body-sm text-slate-600">You've completed 100 calls this month</p>
              <p className="text-caption text-slate-500 mt-1">1 day ago</p>
            </div>
            <span className="badge badge-warning">Milestone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
