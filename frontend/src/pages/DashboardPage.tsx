import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Clock, TrendingUp, Calendar, Upload, Settings, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { billingAPI, agentAPI, analyticsAPI } from '../services/api';
import type { Usage, Agent, DashboardStats } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

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
    <div className="space-y-8 p-10">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Dashboard
          </h1>
          <p className="text-base text-slate-600 font-medium">Plan, prioritize, and manage your AI agent with ease.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={() => navigate('/calls')}>
            <Phone className="w-4 h-4" />
            Start Call
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
            <Upload className="w-4 h-4" />
            Import Data
          </button>
        </div>
      </div>

      {/* Onboarding Banner - Show if no agent */}
      {!agent && (
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-semibold">Get Started</span>
                </div>
                <h2 className="text-3xl font-bold mb-3">Welcome to Vami! 🎉</h2>
                <p className="text-lg text-white/90 mb-6 max-w-2xl">
                  You're all set! Create your first AI voice agent in just 3 simple steps.
                  Choose a template, customize it, and start receiving calls in minutes.
                </p>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/95 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center gap-3"
                >
                  <Settings className="w-6 h-6" />
                  Create Your First Agent
                  <span className="text-2xl">→</span>
                </button>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Phone className="w-16 h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Calls - Featured Card */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 rounded-2xl p-8 text-white transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
          style={{
            boxShadow: '0 8px 24px -4px rgba(5, 150, 105, 0.4)'
          }}
        >
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Total Calls</p>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Phone className="w-6 h-6" />
              </div>
            </div>
            <p className="text-5xl font-bold mb-3 tracking-tight">{stats?.total_calls || 0}</p>
            <div className="flex items-center gap-2 text-sm opacity-95 font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                <TrendingUp className="w-4 h-4" />
                <span>+12.5%</span>
              </div>
              <span>vs last month</span>
            </div>
          </div>
        </div>

        {/* Minutes Used */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="badge badge-info">{usage?.percentage_used.toFixed(0) || 0}%</span>
          </div>
          <p className="metric-label mb-2">Minutes Used</p>
          <p className="metric-value">
            {usage?.minutes_used.toFixed(0) || 0}
            <span className="text-xl text-slate-400 ml-2 font-semibold">/{usage?.minutes_limit || 0}</span>
          </p>
          {usage && (
            <div className="mt-5">
              <div className="progress-bar h-2.5 bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(usage.percentage_used, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Success Rate */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-sm">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="badge badge-success">+5.2%</span>
          </div>
          <p className="metric-label mb-2">Success Rate</p>
          <p className="metric-value">
            {stats ? Math.round((stats.successful_calls / (stats.total_calls || 1)) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-2.5 font-semibold">
            {stats?.successful_calls || 0} successful calls
          </p>
        </div>

        {/* Appointments */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3.5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-sm">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="badge badge-warning">+8</span>
          </div>
          <p className="metric-label mb-2">Appointments</p>
          <p className="metric-value">{stats?.appointments_booked || 0}</p>
          <p className="text-xs text-slate-500 mt-2.5 font-semibold">Scheduled this month</p>
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
            <button className="btn btn-primary w-full justify-between" onClick={() => navigate('/settings')}>
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

            <button className="btn btn-secondary w-full justify-between" onClick={() => navigate('/calendar')}>
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

            <button className="btn btn-secondary w-full justify-between" onClick={() => navigate('/analytics')}>
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

            <button className="btn btn-secondary w-full justify-between" onClick={() => navigate('/settings')}>
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

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/settings" className="btn btn-secondary text-center">
            Configure Agent Settings
          </Link>
          <Link to="/analytics" className="btn btn-secondary text-center">
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
