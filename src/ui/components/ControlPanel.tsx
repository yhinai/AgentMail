import React, { useState } from 'react';

interface ControlPanelProps {
  isRunning: boolean;
  onStartDemo: () => void;
  onStop: () => void;
}

export default function ControlPanel({
  isRunning,
  onStartDemo,
  onStop,
}: ControlPanelProps) {
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const handleRunDemo = async () => {
    setIsDemoRunning(true);
    try {
      await onStartDemo();
    } finally {
      setTimeout(() => setIsDemoRunning(false), 5000);
    }
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Control Panel</h2>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleRunDemo}
          disabled={isDemoRunning}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isDemoRunning ? 'Running Demo...' : 'Run Full Demo'}
        </button>
        
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Stop System
        </button>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
}
