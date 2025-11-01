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
      icon: 'https://img.icons8.com/?id=eYaVJ9Nbqqbw&format=png&size=64',
    },
    {
      title: 'Deals Completed',
      value: metrics.dealsCompleted.toString(),
      change: '+3',
      trend: 'up',
      icon: 'https://img.icons8.com/?id=pIPl8tqh3igN&format=png&size=64',
    },
    {
      title: 'Conversion Rate',
      value: `${(metrics.conversionRate * 100).toFixed(1)}%`,
      change: '+2.1%',
      trend: 'up',
      icon: 'https://img.icons8.com/?id=4VdgitiyspJ9&format=png&size=64',
    },
    {
      title: 'Response Time',
      value: `${metrics.averageResponseTime}ms`,
      change: '-15%',
      trend: 'down',
      icon: 'https://img.icons8.com/?id=GtgqQIYSqT50&format=png&size=64',
    },
    {
      title: 'Emails Processed',
      value: metrics.emailsProcessed.toString(),
      change: '+24',
      trend: 'up',
      icon: 'https://img.icons8.com/?id=bqI4gOgp4z1f&format=png&size=64',
    },
    {
      title: 'Active Listings',
      value: metrics.activeListings.toString(),
      change: '+5',
      trend: 'up',
      icon: 'https://img.icons8.com/?id=Gr1XbweybhTw&format=png&size=64',
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
            <div className="w-12 h-12">
              <img src={card.icon} alt={card.title} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
