import React from 'react';
import MetricsPanel from './MetricsPanel';
import ActivityFeed from './ActivityFeed';
import TransactionList from './TransactionList';
import ProductList from './ProductList';
import { Metrics, ActivityLog, Transaction } from '../../types';
import './Dashboard.css';

interface DashboardProps {
  metrics: Metrics | null;
  activity: ActivityLog[];
  transactions: Transaction[];
  connected: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  activity,
  transactions,
  connected,
}) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>ProfitPilot</h1>
          <p>Autonomous E-Commerce AI Agent</p>
        </div>
        <div className="status-indicator">
          <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <MetricsPanel metrics={metrics} />
          <div className="dashboard-grid">
            <div className="dashboard-section">
              <h2>Recent Activity</h2>
              <ActivityFeed activities={activity} />
            </div>
            <div className="dashboard-section">
              <h2>Transactions</h2>
              <TransactionList transactions={transactions} />
            </div>
          </div>
        </div>
        <div className="dashboard-sidebar">
          <ProductList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

