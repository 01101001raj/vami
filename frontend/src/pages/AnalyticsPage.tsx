import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import type { Conversation } from '../types';
import { format } from 'date-fns';

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
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">View your call history and conversation details</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="pb-3 text-gray-600 font-medium">Date</th>
                <th className="pb-3 text-gray-600 font-medium">Title</th>
                <th className="pb-3 text-gray-600 font-medium">Duration</th>
                <th className="pb-3 text-gray-600 font-medium">Sentiment</th>
                <th className="pb-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No conversations yet
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => (
                  <tr key={conv.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">{format(new Date(conv.created_at), 'MMM d, yyyy h:mm a')}</td>
                    <td className="py-4">{conv.title || 'Untitled'}</td>
                    <td className="py-4">{conv.duration_secs ? `${Math.round(conv.duration_secs / 60)}m` : '-'}</td>
                    <td className="py-4">
                      {conv.sentiment && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          conv.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          conv.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {conv.sentiment}
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        conv.call_successful === 'successful' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {conv.call_successful || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
