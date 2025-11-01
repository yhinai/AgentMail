import React from 'react';
import { ActivityLog } from '../../types';
import './ActivityFeed.css';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_received':
        return '📥';
      case 'email_sent':
        return '📤';
      case 'listing_created':
        return '➕';
      case 'negotiation_started':
        return '🤝';
      case 'deal_closed':
        return '💰';
      case 'price_updated':
        return '📊';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="activity-feed">
      {activities.length === 0 ? (
        <div className="activity-empty">No activity yet</div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-description">
                  {activity.description}
                </div>
                <div className="activity-time">
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;

