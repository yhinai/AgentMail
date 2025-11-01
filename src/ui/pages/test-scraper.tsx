import { useState } from 'react';
import Head from 'next/head';

export default function TestScraper() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [query, setQuery] = useState('macbook M3 pro');

  const testEbayScraper = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/scrape-ebay-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: query,
          maxProducts: 2
        })
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error: any) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Test Scraper</title>
      </Head>

      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🧪 Screenshot Scraper Test</h1>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-medium mb-2">Search Query:</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="Enter search query..."
            />
            
            <button
              onClick={testEbayScraper}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄 Scraping...' : '🚀 Test eBay Scraper'}
            </button>
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">⏳ Scraping eBay... This may take 20-30 seconds...</p>
            </div>
          )}

          {results && !loading && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                {results.success ? '✅ Results' : '❌ Error'}
              </h2>

              {results.error && (
                <p className="text-red-600">{results.error}</p>
              )}

              {results.success && (
                <>
                  <p className="mb-4">Found {results.totalFound} products</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.products?.map((product: any, index: number) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        {product.screenshot && (
                          <img
                            src={product.screenshot}
                            alt={product.title}
                            className="w-full h-64 object-cover bg-gray-100"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">{product.title}</h3>
                          <p className="text-2xl font-bold text-green-600 mb-2">
                            ${product.price}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            Condition: {product.condition}
                          </p>
                          <p className="text-sm text-gray-600 mb-3">
                            Seller: {product.seller}
                          </p>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View on eBay →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
