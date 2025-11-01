import type { NextApiRequest, NextApiResponse } from 'next';

const BRIDGE_URL = 'http://localhost:8001';

interface ProductData {
  url: string;
  title: string;
  price: number;
  screenshot: string; // base64 data URL
  condition?: string;
  seller?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchQuery, maxProducts = 3 } = req.body;

  if (!searchQuery) {
    return res.status(400).json({ error: 'searchQuery is required' });
  }

  let sessionId: string | null = null;

  try {
    // Create browser session
    const sessionResponse = await fetch(`${BRIDGE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headless: true,
        viewport: { width: 1920, height: 1080 }
      })
    });

    if (!sessionResponse.ok) {
      throw new Error('Failed to create browser session');
    }

    const { sessionId: sid } = await sessionResponse.json();
    sessionId = sid;

    // Navigate to eBay search
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
    
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: searchUrl })
    });

    // Wait for page load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot of search results
    const searchScreenshotResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
    let searchScreenshot = '';
    
    if (searchScreenshotResp.ok) {
      const { screenshot } = await searchScreenshotResp.json();
      searchScreenshot = formatScreenshot(screenshot);
    }

    // Get product URLs from HTML
    const htmlScript = '() => document.documentElement.outerHTML';
    const htmlResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: htmlScript })
    });

    let productUrls: string[] = [];

    if (htmlResp.ok) {
      const { result: html } = await htmlResp.json();
      
      // Extract product URLs using regex
      const itemRegex = /href="(https:\/\/www\.ebay\.com\/itm\/[^"]+)"/g;
      const matches = html.matchAll(itemRegex);
      const uniqueUrls = new Set<string>();
      
      for (const match of matches) {
        let url = match[1];
        url = url.split('?')[0]; // Remove query params
        if (!url.includes('pulsar') && uniqueUrls.size < maxProducts) {
          uniqueUrls.add(url);
        }
      }
      
      productUrls = Array.from(uniqueUrls);
    }

    // If no URLs found, try alternative method
    if (productUrls.length === 0) {
      const altScript = `
        () => {
          const links = [];
          const anchors = document.querySelectorAll('a[href*="/itm/"]');
          for (let i = 0; i < Math.min(${maxProducts}, anchors.length); i++) {
            const href = anchors[i].href;
            if (href && !href.includes('pulsar')) {
              links.push(href.split('?')[0]);
            }
          }
          return JSON.stringify([...new Set(links)]);
        }
      `;
      
      const altResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: altScript })
      });
      
      if (altResp.ok) {
        const { result } = await altResp.json();
        try {
          productUrls = JSON.parse(result);
        } catch (e) {
          console.error('Could not parse URLs');
        }
      }
    }

    // Scrape each product
    const products: ProductData[] = [];

    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      
      try {
        // Navigate to product
        const navResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (!navResp.ok) continue;

        // Wait for page load
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Scroll to load images
        await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: '() => window.scrollTo(0, 500)' })
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract product details
        const detailsScript = `
          () => {
            const title = document.querySelector('h1.x-item-title__mainTitle')?.textContent?.trim() || 
                         document.querySelector('.it-ttl')?.textContent?.trim() || 
                         'Product';
            
            const priceElement = document.querySelector('.x-price-primary span.ux-textspans') ||
                                document.querySelector('.x-price-primary') ||
                                document.querySelector('[itemprop="price"]');
            const priceText = priceElement?.textContent?.trim() || '0';
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
            
            const condition = document.querySelector('.x-item-condition-text span')?.textContent?.trim() ||
                             document.querySelector('.ux-labels-values__values-content span')?.textContent?.trim() ||
                             'Used';
            
            const seller = document.querySelector('.ux-seller-section__item--seller a')?.textContent?.trim() ||
                          document.querySelector('.mbg-nw')?.textContent?.trim() ||
                          'Unknown';
            
            return JSON.stringify({ title, price, condition, seller });
          }
        `;

        const detailsResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: detailsScript })
        });

        let productDetails = { title: 'Product', price: 0, condition: 'Used', seller: 'Unknown' };
        
        if (detailsResp.ok) {
          const { result } = await detailsResp.json();
          try {
            productDetails = JSON.parse(result);
          } catch (e) {
            console.error('Could not parse product details');
          }
        }

        // Take screenshot
        const screenshotResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
        let screenshot = '';
        
        if (screenshotResp.ok) {
          const { screenshot: ss } = await screenshotResp.json();
          screenshot = formatScreenshot(ss);
        }

        products.push({
          url,
          title: productDetails.title,
          price: productDetails.price,
          condition: productDetails.condition,
          seller: productDetails.seller,
          screenshot
        });

      } catch (error) {
        console.error(`Error scraping product ${i + 1}:`, error);
      }
    }

    // Close session
    if (sessionId) {
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      searchQuery,
      searchScreenshot,
      products,
      totalFound: products.length
    });

  } catch (error: any) {
    // Clean up session on error
    if (sessionId) {
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }

    console.error('Screenshot scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scrape eBay screenshots'
    });
  }
}

function formatScreenshot(screenshot: any): string {
  if (typeof screenshot === 'string') {
    // If already a data URL, return as is
    if (screenshot.startsWith('data:')) {
      return screenshot;
    }
    // If base64 without prefix, add it
    return `data:image/jpeg;base64,${screenshot}`;
  }
  // If buffer, convert to base64
  return `data:image/jpeg;base64,${Buffer.from(screenshot).toString('base64')}`;
}
