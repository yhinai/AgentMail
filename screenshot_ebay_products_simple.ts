/**
 * Simple script to screenshot eBay products by directly navigating to product URLs
 */

async function screenshotEbayProducts(searchQuery: string) {
  const BRIDGE_URL = 'http://localhost:8001';
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📸 eBay Product Screenshot Tool`);
    console.log(`Search: "${searchQuery}"\n`);
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
    
    // Create browser session
    console.log('1️⃣ Creating browser session...');
    const sessionResponse = await fetch(`${BRIDGE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headless: false,
        viewport: { width: 1920, height: 1080 }
      })
    });
    
    const { sessionId } = await sessionResponse.json();
    console.log(`✅ Session: ${sessionId}\n`);
    
    // Navigate to search
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
    console.log(`2️⃣ Navigating to search results...`);
    console.log(`   ${searchUrl}`);
    
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: searchUrl })
    });
    
    // Wait for page
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Screenshot search results
    console.log(`\n3️⃣ Taking screenshot of search results...`);
    let screenshotResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
    if (screenshotResp.ok) {
      const { screenshot } = await screenshotResp.json();
      saveScreenshot(screenshot, path.join(screenshotsDir, 'search_results.jpg'));
      console.log(`✅ Saved: search_results.jpg`);
    }
    
    // Get the HTML to parse links server-side
    console.log(`\n4️⃣ Extracting product links...`);
    const htmlScript = '() => document.documentElement.outerHTML';
    const htmlResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: htmlScript })
    });
    
    let productUrls: string[] = [];
    
    if (htmlResp.ok) {
      const { result: html } = await htmlResp.json();
      
      // Parse HTML to extract product URLs
      const itemRegex = /href="(https:\/\/www\.ebay\.com\/itm\/[^"]+)"/g;
      const matches = html.matchAll(itemRegex);
      const uniqueUrls = new Set<string>();
      
      for (const match of matches) {
        let url = match[1];
        // Clean up the URL
        url = url.split('?')[0]; // Remove query params
        if (!url.includes('pulsar') && uniqueUrls.size < 3) {
          uniqueUrls.add(url);
        }
      }
      
      productUrls = Array.from(uniqueUrls);
      console.log(`✅ Found ${productUrls.length} product URLs\n`);
    }
    
    // If no URLs found, try alternative approach
    if (productUrls.length === 0) {
      console.log('⚠️  No product URLs found in HTML, trying alternative selectors...\n');
      
      // Try to get URLs using different method
      const altScript = `
        () => {
          const links = [];
          const anchors = document.querySelectorAll('a[href*="/itm/"]');
          for (let i = 0; i < Math.min(3, anchors.length); i++) {
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
          console.log(`✅ Found ${productUrls.length} URLs using alternative method\n`);
        } catch (e) {
          console.log('⚠️  Could not parse URLs\n');
        }
      }
    }
    
    // Screenshot each product
    console.log(`5️⃣ Taking screenshots of individual products...\n`);
    
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      console.log(`📦 Product ${i + 1}/${productUrls.length}`);
      console.log(`   ${url}`);
      
      // Navigate
      const navResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!navResp.ok) {
        console.log(`   ❌ Navigation failed\n`);
        continue;
      }
      
      // Wait for page load
      console.log(`   ⏳ Loading...`);
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Scroll
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: '() => window.scrollTo(0, 500)' })
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Screenshot
      console.log(`   📸 Capturing...`);
      const prodScreenResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
      
      if (prodScreenResp.ok) {
        const { screenshot } = await prodScreenResp.json();
        const filename = `product_${i + 1}.jpg`;
        saveScreenshot(screenshot, path.join(screenshotsDir, filename));
        console.log(`   ✅ Saved: ${filename}\n`);
      } else {
        console.log(`   ❌ Screenshot failed\n`);
      }
    }
    
    // Close
    console.log(`6️⃣ Closing browser...`);
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
    
    console.log(`\n✅ Complete!`);
    console.log(`📁 Location: ${screenshotsDir}`);
    console.log(`📊 Total screenshots: ${productUrls.length + 1}`);
    
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  }
}

function saveScreenshot(screenshot: any, filepath: string) {
  const fs = require('fs');
  let imageBuffer;
  
  if (typeof screenshot === 'string') {
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    imageBuffer = Buffer.from(screenshot);
  }
  
  fs.writeFileSync(filepath, imageBuffer);
}

// Main
const query = process.argv.slice(2).join(' ') || 'macbook M3 pro';

screenshotEbayProducts(query)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
