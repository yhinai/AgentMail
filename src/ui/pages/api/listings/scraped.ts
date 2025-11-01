import type { NextApiRequest, NextApiResponse } from 'next';

// Store for real scraped listings from browser-use
const realScrapedListings: any[] = [];

// Function to add scraped listing from browser-use
export function addScrapedListing(listing: any) {
  realScrapedListings.unshift(listing); // Add to beginning
  // Keep only last 50 listings
  if (realScrapedListings.length > 50) {
    realScrapedListings.pop();
  }
}

// Function to clear scraped listings
export function clearScrapedListings() {
  realScrapedListings.length = 0;
}

// No mock data - only show real scraped listings from browser-use
const mockListings: any[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, platform, minPrice, maxPrice } = req.query;

    // Combine real scraped listings with mock data
    // Real listings appear first
    let allListings = [...realScrapedListings, ...mockListings];
    
    // Filter listings based on query parameters
    let filteredListings = [...allListings];

    if (category) {
      filteredListings = filteredListings.filter(
        listing => listing.category.toLowerCase() === (category as string).toLowerCase()
      );
    }

    if (platform) {
      filteredListings = filteredListings.filter(
        listing => listing.platform.toLowerCase() === (platform as string).toLowerCase()
      );
    }

    if (minPrice) {
      filteredListings = filteredListings.filter(
        listing => listing.listingPrice >= parseFloat(minPrice as string)
      );
    }

    if (maxPrice) {
      filteredListings = filteredListings.filter(
        listing => listing.listingPrice <= parseFloat(maxPrice as string)
      );
    }

    res.status(200).json({ listings: filteredListings });
  } catch (error: any) {
    console.error('Scraped listings API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch scraped listings'
    });
  }
}
