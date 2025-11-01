import React from 'react';
import { Metrics } from '../../types';
import './MetricsPanel.css';

interface MetricsPanelProps {
  metrics: Metrics | null;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="metrics-panel">
        <div className="metrics-loading">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="metrics-panel">
      <div className="metric-card profit">
        <div className="metric-icon">💰</div>
        <div className="metric-content">
          <div className="metric-label">Total Profit</div>
          <div className="metric-value">${metrics.totalProfit.toFixed(2)}</div>
        </div>
      </div>

      <div className="metric-card deals">
        <div className="metric-icon">✅</div>
        <div className="metric-content">
          <div className="metric-label">Deals Completed</div>
          <div className="metric-value">{metrics.dealsCompleted}</div>
        </div>
      </div>

      <div className="metric-card revenue">
        <div className="metric-icon">💵</div>
        <div className="metric-content">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">${metrics.totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      <div className="metric-card conversion">
        <div className="metric-icon">📈</div>
        <div className="metric-content">
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">
            {(metrics.conversionRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="metric-card margin">
        <div className="metric-icon">📊</div>
        <div className="metric-content">
          <div className="metric-label">Avg Profit Margin</div>
          <div className="metric-value">
            {metrics.averageProfitMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="metric-card emails">
        <div className="metric-icon">📧</div>
        <div className="metric-content">
          <div className="metric-label">Emails Processed</div>
          <div className="metric-value">{metrics.emailsProcessed}</div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;

