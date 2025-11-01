import React, { useState } from 'react';

interface CommandInputProps {
  onCommandSubmit: (command: string) => Promise<string>; // Returns commandId
}

interface ParsedPreview {
  budget?: number;
  quantity?: number;
  category?: string;
  action?: string;
}

export default function CommandInput({ onCommandSubmit }: CommandInputProps) {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commandId, setCommandId] = useState<string | null>(null);

  // Debounced preview analysis
  const analyzeCommand = async (cmd: string) => {
    if (cmd.length < 10) {
      setPreview(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call API to get preview (this would use LLM for real-time preview)
      const response = await fetch('/api/command/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.parsed);
      }
    } catch (err) {
      // Preview is optional, don't show errors
      console.debug('Preview analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommand(value);
    setError(null);
    
    // Analyze for preview (debounced)
    const timeoutId = setTimeout(() => analyzeCommand(value), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) {
      setError('Please enter a command');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const id = await onCommandSubmit(command.trim());
      setCommandId(id);
      setCommand('');
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit command');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Command Interface
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
            Enter Command
          </label>
          <textarea
            id="command"
            value={command}
            onChange={handleChange}
            placeholder="e.g., Give it $50 budget, buy 1 flippable item in electronics, resell it."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={isLoading}
          />
          {isAnalyzing && (
            <p className="text-xs text-gray-500 mt-1">Analyzing command...</p>
          )}
        </div>


        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}


        <button
          type="submit"
          disabled={isLoading || !command.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Submitting...' : 'Execute Command'}
        </button>
      </form>
    </div>
  );
}

