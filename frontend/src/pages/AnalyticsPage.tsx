import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import type { Conversation } from '../types';
import { format } from 'date-fns';
import { Phone, Clock, TrendingUp, Filter, Download, Search, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await analyticsAPI.getConversations();
        setConversations(response.data);
      } catch (error) {
        console.error('Failed to fetch conversations', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-12 h-12 mb-4"></div>
          <p className="text-body text-slate-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCalls = conversations.length;
  const totalDuration = conversations.reduce((acc, conv) => acc + (conv.duration_secs || 0), 0);
  const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
  const successfulCalls = conversations.filter(c => c.call_successful === 'successful').length;
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
  const positiveSentiment = conversations.filter(c => c.sentiment === 'positive').length;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-slate-900 mb-2">
            Analytics
          </h1>
          <p className="text-body text-slate-600">Detailed insights into your call performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="btn btn-primary">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Conversations */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <Phone className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="metric-label">Total Conversations</p>
          <p className="metric-value">{totalCalls}</p>
          <p className="text-caption text-primary-600 font-medium mt-2">All time</p>
        </div>

        {/* Avg Duration */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="metric-label">Avg Duration</p>
          <p className="metric-value">{Math.round(avgDuration / 60)}<span className="text-lg text-slate-400">m</span></p>
          <p className="text-caption text-blue-600 font-medium mt-2">Per call</p>
        </div>

        {/* Success Rate */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="metric-label">Success Rate</p>
          <p className="metric-value">{Math.round(successRate)}<span className="text-lg text-slate-400">%</span></p>
          <p className="text-caption text-primary-600 font-medium mt-2">{successfulCalls} successful</p>
        </div>

        {/* Positive Sentiment */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="metric-label">Positive Sentiment</p>
          <p className="metric-value">{positiveSentiment}</p>
          <p className="text-caption text-purple-600 font-medium mt-2">Happy customers</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="input pl-12"
            />
          </div>
          <select className="input">
            <option>All Status</option>
            <option>Successful</option>
            <option>Failed</option>
          </select>
          <select className="input">
            <option>All Sentiment</option>
            <option>Positive</option>
            <option>Neutral</option>
            <option>Negative</option>
          </select>
        </div>
      </div>

      {/* Conversations Table */}
      <div className="table-container">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-h2 text-slate-900">Call History</h2>
          <p className="text-body-sm text-slate-600 mt-1">Complete record of all conversations</p>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Title</th>
                <th>Duration</th>
                <th>Sentiment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                        <Phone className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-900 font-semibold text-body-lg mb-1">No conversations yet</p>
                      <p className="text-slate-500 text-body-sm">Start making calls to see analytics data here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-body-sm font-semibold text-slate-900">
                            {format(new Date(conv.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-caption text-slate-500">
                            {format(new Date(conv.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-body-sm font-medium text-slate-900">{conv.title || 'Untitled Conversation'}</p>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-body-sm font-medium text-slate-700">
                          {conv.duration_secs ? `${Math.round(conv.duration_secs / 60)}m ${conv.duration_secs % 60}s` : '-'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {conv.sentiment ? (
                        <span className={`badge ${
                          conv.sentiment === 'positive' ? 'badge-success' :
                          conv.sentiment === 'negative' ? 'badge-error' :
                          'badge-neutral'
                        }`}>
                          {conv.sentiment.charAt(0).toUpperCase() + conv.sentiment.slice(1)}
                        </span>
                      ) : (
                        <span className="text-body-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td>
                      <span className={conv.call_successful === 'successful' ? 'badge badge-success' : 'badge badge-neutral'}>
                        {conv.call_successful === 'successful' ? (
                          <>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Successful
                          </>
                        ) : (
                          conv.call_successful || 'Unknown'
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {conversations.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-body-sm text-slate-600">
              Showing <span className="font-semibold">{conversations.length}</span> conversation{conversations.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2">
              <button className="btn btn-secondary btn-sm">
                Previous
              </button>
              <button className="btn btn-primary btn-sm">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
