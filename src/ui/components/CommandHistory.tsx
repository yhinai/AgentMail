import React, { useState, useEffect } from 'react';

interface CommandExecution {
  commandId: string;
  originalCommand: string;
  parsedCommand?: {
    budget: number;
    quantity: number;
    category: string;
    action: string;
  };
  status: 'pending' | 'analyzing' | 'searching' | 'evaluating' | 'selecting' | 'purchasing' | 'listing' | 'finding' | 'negotiating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  expectedProfit?: number;
  message?: string;
  timestamp?: string;
}

export default function CommandHistory() {
  const [commands, setCommands] = useState<CommandExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const response = await fetch('/api/commands/history');
        if (response.ok) {
          const data = await response.json();
          const newCommands = data.commands || [];
          
          // Merge with existing commands, updating any that changed
          setCommands(prevCommands => {
            const merged = [...newCommands];
            
            // Add any commands from previous state that aren't in new data
            prevCommands.forEach(prevCmd => {
              if (!merged.find(cmd => cmd.commandId === prevCmd.commandId)) {
                merged.push(prevCmd);
              }
            });
            
            // Sort by timestamp, newest first
            return merged.sort((a, b) => 
              new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
            );
          });
        }
      } catch (error) {
        console.error('Error fetching command history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
    
    // Poll for updates every 1 second for real-time updates
    const interval = setInterval(fetchCommands, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Command History</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Command History</h2>
      
      {commands.length === 0 ? (
        <p className="text-gray-500 text-sm">No commands executed yet</p>
      ) : (
        <div className="space-y-4">
          {commands.map((cmd) => (
            <div
              key={cmd.commandId}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{cmd.originalCommand}</p>
                  {cmd.parsedCommand && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <div className="flex gap-4">
                        <span>Budget: ${cmd.parsedCommand.budget}</span>
                        <span>Qty: {cmd.parsedCommand.quantity}</span>
                        <span className="capitalize">{cmd.parsedCommand.category}</span>
                      </div>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(cmd.status)}`}>
                  {cmd.status}
                </span>
              </div>

              {cmd.message && cmd.status !== 'completed' && (
                <div className="mt-2">
                  <p className="text-sm text-blue-600 font-medium">{cmd.message}</p>
                </div>
              )}

              {cmd.progress !== undefined && cmd.progress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cmd.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{cmd.progress}% complete</p>
                </div>
              )}


              {cmd.error && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs text-red-800">{cmd.error}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">ID: {cmd.commandId.substring(0, 8)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

