import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { Metrics, ActivityLog, Transaction } from '../types';

function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('Connected to ProfitPilot');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'metrics') {
        setMetrics(data.data);
      } else if (data.type === 'update') {
        setMetrics(data.data.metrics);
        setActivity(data.data.recentActivity || []);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from ProfitPilot');
      setConnected(false);
    };

    // Fetch initial data
    fetch('http://localhost:3001/api/metrics')
      .then((res) => res.json())
      .then(setMetrics)
      .catch(console.error);

    fetch('http://localhost:3001/api/activity?limit=20')
      .then((res) => res.json())
      .then(setActivity)
      .catch(console.error);

    fetch('http://localhost:3001/api/transactions?limit=10')
      .then((res) => res.json())
      .then(setTransactions)
      .catch(console.error);

    // Poll for updates as fallback
    const interval = setInterval(() => {
      fetch('http://localhost:3001/api/metrics')
        .then((res) => res.json())
        .then(setMetrics)
        .catch(console.error);

      fetch('http://localhost:3001/api/activity?limit=20')
        .then((res) => res.json())
        .then(setActivity)
        .catch(console.error);
    }, 10000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="App">
      <Dashboard
        metrics={metrics}
        activity={activity}
        transactions={transactions}
        connected={connected}
      />
    </div>
  );
}

export default App;

