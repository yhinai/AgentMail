import type { NextApiRequest, NextApiResponse } from 'next';

const BRIDGE_URL = 'http://localhost:8001';

interface DomainSearchResult {
  url: string;
  title: string;
  price?: number;
  priceText?: string;
  screenshot: string;
  description?: string;
  availability?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, searchQuery, maxResults = 5 } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'domain is required' });
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

    // Determine the URL to visit
    let targetUrl = domain;
    
    // Add https:// if not present
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      targetUrl = `https://${domain}`;
    }

    // If there's a search query, try to construct a search URL
    if (searchQuery) {
      // Common search patterns for different domains
      if (domain.includes('ebay.com')) {
        targetUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
      } else if (domain.includes('amazon.com')) {
        targetUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
      } else if (domain.includes('craigslist.org')) {
        targetUrl = `https://${domain}/search/sss?query=${encodeURIComponent(searchQuery)}`;
      } else {
        // Generic: just append search query to domain
        targetUrl = `${targetUrl}?q=${encodeURIComponent(searchQuery)}`;
      }
    }

    // Navigate to the URL
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl })
    });

    // Wait for page load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot of main page
    const mainScreenshotResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
    let mainScreenshot = '';
    
    if (mainScreenshotResp.ok) {
      const { screenshot } = await mainScreenshotResp.json();
      mainScreenshot = formatScreenshot(screenshot);
    }

    // Extract all prices from the page
    const priceExtractionScript = `
      () => {
        const results = [];
        
        // Common price selectors across different websites
        const priceSelectors = [
          '[class*="price"]',
          '[class*="Price"]',
          '[data-price]',
          '[itemprop="price"]',
          '.amount',
          '.cost',
          '.value'
        ];
        
        // Common title/link selectors
        const itemSelectors = [
          'a[href*="/itm/"]',  // eBay
          'a[href*="/dp/"]',   // Amazon
          'a[href*="/product"]', // Generic
          '.result',
          '.item',
          '.listing',
          '[class*="product"]',
          '[class*="Product"]'
        ];
        
        // Try to find items/listings
        let items = [];
        for (const selector of itemSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            items = Array.from(elements).slice(0, ${maxResults});
            break;
          }
        }
        
        // If we found items, extract details from each
        if (items.length > 0) {
          items.forEach((item, index) => {
            const container = item.closest('[class*="item"], [class*="result"], [class*="listing"], [class*="product"]') || item;
            
            // Extract title
            const titleEl = container.querySelector('h1, h2, h3, h4, [class*="title"], [class*="Title"]');
            const title = titleEl?.textContent?.trim() || item.textContent?.trim()?.substring(0, 100) || \`Item \${index + 1}\`;
            
            // Extract price
            let priceText = '';
            let price = 0;
            
            for (const selector of priceSelectors) {
              const priceEl = container.querySelector(selector);
              if (priceEl) {
                priceText = priceEl.textContent?.trim() || '';
                if (priceText) {
                  const match = priceText.match(/[\d,]+\.?\d*/);
                  if (match) {
                    price = parseFloat(match[0].replace(/,/g, ''));
                    break;
                  }
                }
              }
            }
            
            // Extract URL
            const url = item.href || container.querySelector('a')?.href || '';
            
            // Extract description
            const descEl = container.querySelector('[class*="desc"], [class*="summary"], p');
            const description = descEl?.textContent?.trim()?.substring(0, 200) || '';
            
            results.push({
              title,
              price,
              priceText,
              url,
              description
            });
          });
        } else {
          // Fallback: just find all prices on the page
          const allPrices = new Set();
          
          for (const selector of priceSelectors) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent?.trim();
              if (text && /[\d,]+\.?\d*/.test(text)) {
                allPrices.add(text);
              }
            });
          }
          
          Array.from(allPrices).slice(0, ${maxResults}).forEach((priceText, index) => {
            const match = (priceText as string).match(/[\d,]+\.?\d*/);
            const price = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
            
            results.push({
              title: \`Item \${index + 1} from ${domain}\`,
              price,
              priceText: priceText as string,
              url: window.location.href,
              description: ''
            });
          });
        }
        
        return JSON.stringify(results);
      }
    `;

    const extractResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: priceExtractionScript })
    });

    let extractedItems: any[] = [];
    
    if (extractResp.ok) {
      const { result } = await extractResp.json();
      try {
        extractedItems = JSON.parse(result);
      } catch (e) {
        console.error('Could not parse extracted items');
      }
    }

    // If no items found, create at least one result with the main page
    if (extractedItems.length === 0) {
      extractedItems.push({
        title: `${domain} - Main Page`,
        price: 0,
        priceText: 'No prices found',
        url: targetUrl,
        description: 'Visited page but no prices were detected'
      });
    }
    
    // If we have URLs, visit each and take screenshots
    const results: DomainSearchResult[] = [];
    
    for (let i = 0; i < Math.min(extractedItems.length, maxResults); i++) {
      const item = extractedItems[i];
      
      // If item has a unique URL, visit it and take screenshot
      if (item.url && item.url !== targetUrl && item.url.startsWith('http')) {
        try {
          await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.url })
          });

          await new Promise(resolve => setTimeout(resolve, 4000));

          // Scroll to load content
          await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: '() => window.scrollTo(0, 500)' })
          });

          await new Promise(resolve => setTimeout(resolve, 2000));

          // Take screenshot
          const itemScreenshotResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
          
          if (itemScreenshotResp.ok) {
            const { screenshot } = await itemScreenshotResp.json();
            item.screenshot = formatScreenshot(screenshot);
          }
        } catch (e) {
          console.error(`Error capturing screenshot for item ${i + 1}:`, e);
          item.screenshot = mainScreenshot; // Use main page screenshot as fallback
        }
      } else {
        // Use main page screenshot
        item.screenshot = mainScreenshot;
      }
      
      results.push({
        url: item.url || targetUrl,
        title: item.title || `Item ${i + 1}`,
        price: item.price,
        priceText: item.priceText,
        screenshot: item.screenshot || mainScreenshot,
        description: item.description,
        availability: item.availability
      });
    }

    // Close session
    if (sessionId) {
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      domain,
      searchQuery,
      targetUrl,
      mainScreenshot,
      results,
      totalFound: results.length
    });

  } catch (error: any) {
    // Clean up session on error
    if (sessionId) {
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }

    console.error('Web domain scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scrape web domain'
    });
  }
}

function formatScreenshot(screenshot: any): string {
  if (typeof screenshot === 'string') {
    if (screenshot.startsWith('data:')) {
      return screenshot;
    }
    return `data:image/jpeg;base64,${screenshot}`;
  }
  return `data:image/jpeg;base64,${Buffer.from(screenshot).toString('base64')}`;
}
