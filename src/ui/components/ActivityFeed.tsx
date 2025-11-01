import React from 'react';

interface Activity {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Feed</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activities yet</p>
        ) : (
          activities
            .slice()
            .reverse()
            .map((activity) => (
              <div
                key={activity.id}
                className={`p-3 rounded-lg ${getActivityColor(activity.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
