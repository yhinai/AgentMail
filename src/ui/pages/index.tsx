import { useState, useEffect } from 'react';
import Head from 'next/head';
import MetricsCards from '../components/MetricsCards';
import ActivityFeed from '../components/ActivityFeed';
import ControlPanel from '../components/ControlPanel';
import TransactionsTable from '../components/TransactionsTable';
import type { Metrics, Transaction } from '../../types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    dealsCompleted: 0,
    totalProfit: 0,
    totalRevenue: 0,
    conversionRate: 0,
    averageResponseTime: 0,
    averageNegotiationRounds: 0,
    activeListings: 0,
    emailsProcessed: 0,
    lastUpdated: new Date(),
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    // Poll for metrics updates
    const interval = setInterval(async () => {
      try {
        // In production, this would use Convex subscriptions or API calls
        // For demo, we'll use mock data
        const response = await fetch('/api/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleStartDemo = async () => {
    setIsRunning(true);
    setActivities(prev => [...prev, {
      id: Date.now().toString(),
      type: 'info',
      message: 'Demo started',
      timestamp: new Date(),
    }]);

    // In production, this would trigger the demo runner
    try {
      const response = await fetch('/api/demo/run', { method: 'POST' });
      if (response.ok) {
        setActivities(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'success',
          message: 'Demo running successfully',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error starting demo:', error);
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    setIsRunning(false);
    setActivities(prev => [...prev, {
      id: Date.now().toString(),
      type: 'info',
      message: 'System stopped',
      timestamp: new Date(),
    }]);
  };

  return (
    <>
      <Head>
        <title>ProfitPilot Dashboard</title>
        <meta name="description" content="Autonomous AI agent for e-commerce" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ProfitPilot</h1>
                <p className="text-sm text-gray-500">Autonomous E-Commerce Agent</p>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/flip"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Autonomous Flipping
                </a>
                <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Metrics Cards */}
          <MetricsCards metrics={metrics} />

          {/* Control Panel */}
          <div className="mt-8">
            <ControlPanel
              isRunning={isRunning}
              onStartDemo={handleStartDemo}
              onStop={handleStop}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Activity Feed */}
            <ActivityFeed activities={activities} />

            {/* Transactions Table */}
            <TransactionsTable transactions={transactions} />
          </div>
        </div>
      </main>
    </>
  );
}
