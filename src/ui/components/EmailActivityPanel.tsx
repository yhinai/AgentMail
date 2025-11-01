/**
 * Email Activity Panel Component
 * Displays real-time email activity and queue statistics
 */

import React, { useState, useEffect } from 'react';

interface EmailActivity {
  id: string;
  type: 'received' | 'sent' | 'analyzed' | 'error';
  from: string;
  to: string;
  subject: string;
  summary: string;
  timestamp: Date;
  metadata?: any;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface EmailActivityData {
  activity: EmailActivity[];
  stats: QueueStats;
  timestamp: number;
}

export default function EmailActivityPanel() {
  const [data, setData] = useState<EmailActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/email/activity?limit=20');
      if (!response.ok) throw new Error('Failed to fetch activity');

      const data = await response.json();
      setData(data);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">📧 Email Activity</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-600">📧 Email Activity</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const { activity = [], stats = {total: 0, pending: 0, processing: 0, completed: 0, failed: 0} } = data || {};

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">📧 Email Activity</h2>

      {/* Queue Statistics */}
      <div className="mb-6 grid grid-cols-5 gap-3">
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-xs text-gray-500 uppercase">Total</div>
        </div>
        <div className="bg-yellow-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-yellow-700 uppercase">Pending</div>
        </div>
        <div className="bg-blue-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.processing}</div>
          <div className="text-xs text-blue-700 uppercase">Processing</div>
        </div>
        <div className="bg-green-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
          <div className="text-xs text-green-700 uppercase">Completed</div>
        </div>
        <div className="bg-red-100 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
          <div className="text-xs text-red-700 uppercase">Failed</div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activity.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No email activity yet</p>
            <p className="text-sm mt-2">Waiting for incoming emails...</p>
          </div>
        ) : (
          activity.map((item) => (
            <ActivityItem key={item.id} activity={item} />
          ))
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: EmailActivity }) {
  const getIcon = (type: EmailActivity['type']) => {
    switch (type) {
      case 'received': return '📬';
      case 'sent': return '📤';
      case 'analyzed': return '🔍';
      case 'error': return '❌';
      default: return '📧';
    }
  };

  const getColor = (type: EmailActivity['type']) => {
    switch (type) {
      case 'received': return 'border-l-blue-500 bg-blue-50';
      case 'sent': return 'border-l-green-500 bg-green-50';
      case 'analyzed': return 'border-l-purple-500 bg-purple-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  };

  return (
    <div className={`border-l-4 ${getColor(activity.type)} rounded-r-lg p-3 transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getIcon(activity.type)}</span>
            <span className="font-semibold text-sm text-gray-700 uppercase">{activity.type}</span>
            <span className="text-xs text-gray-400">{formatTime(activity.timestamp)}</span>
          </div>

          <div className="text-sm text-gray-800 font-medium mb-1">{activity.subject}</div>

          <div className="text-xs text-gray-600 mb-1">
            <span className="font-semibold">From:</span> {activity.from}
            {activity.to && (
              <>
                {' '}<span className="font-semibold">To:</span> {activity.to}
              </>
            )}
          </div>

          <div className="text-xs text-gray-500">{activity.summary}</div>

          {activity.metadata && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {activity.metadata.intent && (
                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">
                  Intent: {activity.metadata.intent}
                </span>
              )}
              {activity.metadata.sentiment && (
                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">
                  Sentiment: {activity.metadata.sentiment}
                </span>
              )}
              {activity.metadata.urgency && (
                <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">
                  Urgency: {activity.metadata.urgency}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
