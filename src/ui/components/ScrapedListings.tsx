import React, { useState, useEffect } from 'react';

interface ScrapedListing {
  _id: string;
  externalId: string;
  title: string;
  description?: string;
  category: string;
  platform: string;
  url: string;
  listingPrice: number;
  originalPrice?: number;
  images: string[];
  primaryImage?: string;
  profitScore: number;
  location?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  seller: {
    id: string;
    name?: string;
    rating?: number;
    responseTime?: string;
  };
  discoveredAt: number;
}

export default function ScrapedListings() {
  const [listings, setListings] = useState<ScrapedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    platform: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    fetchListings();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchListings, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const response = await fetch(`/api/listings/scraped?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error fetching scraped listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scraped Listings</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Scraped Listings</h2>
        <span className="text-sm text-gray-500">{listings.length} items</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <input
          type="text"
          placeholder="Category"
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="text"
          placeholder="Platform"
          value={filters.platform}
          onChange={(e) => handleFilterChange('platform', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No scraped listings found. Items will appear here as they are discovered.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div
              key={listing._id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {listing.primaryImage && (
                <img
                  src={listing.primaryImage}
                  alt={listing.title}
                  className="w-full h-48 object-cover bg-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                    {listing.title}
                  </h3>
                  <div className="ml-2 flex gap-1">
                    {(listing as any).source === 'browser-use-real' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-semibold">
                        REAL
                      </span>
                    )}
                    {(listing as any).source === 'ebay-screenshot-scraper' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-semibold">
                        📸 SCREENSHOT
                      </span>
                    )}
                    {(listing as any).source === 'web-domain-scraper' && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded font-semibold">
                        🌐 WEB
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {listing.platform}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    ${listing.listingPrice.toLocaleString()}
                  </span>
                  {listing.profitScore > 0 && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      listing.profitScore > 70 ? 'bg-green-100 text-green-800' :
                      listing.profitScore > 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Score: {listing.profitScore}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="capitalize">{listing.category}</div>
                  {listing.location && (
                    <div>
                      {listing.location.city}
                      {listing.location.state && `, ${listing.location.state}`}
                    </div>
                  )}
                </div>

                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800"
                >
                  View Listing →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

