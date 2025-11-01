import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function FlipPage() {
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/commands/flip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute command');
      }

      setSuccessMessage('Flip command started successfully!');
      setCommand('');
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Autonomous Flipping - ProfitPilot</title>
        <meta name="description" content="Execute flip commands with natural language" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Autonomous Flipping</h1>
                <p className="text-sm text-gray-500">Natural language item flipping commands</p>
              </div>
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Command Input */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Flip Command</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
                    Command
                  </label>
                  <textarea
                    id="command"
                    rows={3}
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder='Example: "Give it $50 budget, buy 1 flippable item in electronics, resell it."'
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {successMessage && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !command.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'Starting...' : 'Start Flip Command'}
                </button>
              </div>
            </form>
          </div>

          {/* Instructions */}
          <div className="card">
            <h3 className="text-md font-semibold text-gray-900 mb-3">How it works</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Enter a natural language command describing what you want to buy and sell</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>The system will parse your command and create a budget</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>It will search marketplace platforms for suitable items</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <span>You'll approve at each step: item selection, negotiation, purchase, listing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">5.</span>
                <span>Once complete, the item will be automatically listed for sale</span>
              </li>
            </ul>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Example commands:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>"Give it $50 budget, buy 1 flippable item in electronics, resell it."</li>
                <li>"Find furniture under $200 with 30% profit margin"</li>
                <li>"Buy 2 appliances for under $100 each and list them"</li>
              </ul>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Approval workflows are currently under development. Check back soon for real-time updates and approval modals.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
