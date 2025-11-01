import React from 'react';
import type { Metrics } from '../../types';

interface MetricsCardsProps {
  metrics: Metrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Total Profit',
      value: `$${metrics.totalProfit.toFixed(2)}`,
      change: '+12.5%',
      trend: 'up',
      icon: '💰',
    },
    {
      title: 'Deals Completed',
      value: metrics.dealsCompleted.toString(),
      change: '+3',
      trend: 'up',
      icon: '✅',
    },
    {
      title: 'Conversion Rate',
      value: `${(metrics.conversionRate * 100).toFixed(1)}%`,
      change: '+2.1%',
      trend: 'up',
      icon: '📈',
    },
    {
      title: 'Response Time',
      value: `${metrics.averageResponseTime}ms`,
      change: '-15%',
      trend: 'down',
      icon: '⚡',
    },
    {
      title: 'Emails Processed',
      value: metrics.emailsProcessed.toString(),
      change: '+24',
      trend: 'up',
      icon: '📧',
    },
    {
      title: 'Active Listings',
      value: metrics.activeListings.toString(),
      change: '+5',
      trend: 'up',
      icon: '📋',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="card hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="metric-label">{card.title}</p>
              <p className="metric-value mt-2">{card.value}</p>
              <p
                className={`text-sm mt-2 ${
                  card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {card.change}
              </p>
            </div>
            <div className="text-4xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
