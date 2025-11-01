/**
 * Script to search eBay for products and take screenshots of each listing
 */

async function searchAndScreenshotEbay(searchQuery: string, maxItems: number = 5) {
  const BRIDGE_URL = 'http://localhost:8001';
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📸 Starting eBay product screenshot capture for: "${searchQuery}"`);
    
    // Step 1: Create a browser session
    console.log('1️⃣ Creating browser session...');
    const sessionResponse = await fetch(`${BRIDGE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headless: false, // Set to false to see the browser
        viewport: { width: 1920, height: 1080 }
      })
    });
    
    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
    }
    
    const { sessionId } = await sessionResponse.json();
    console.log(`✅ Session created: ${sessionId}`);
    
    // Step 2: Navigate to eBay search
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
    console.log(`2️⃣ Navigating to eBay search: ${searchUrl}`);
    const navigateResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: searchUrl
      })
    });
    
    if (!navigateResponse.ok) {
      throw new Error(`Failed to navigate: ${navigateResponse.statusText}`);
    }
    
    console.log('✅ Navigated to eBay search results');
    
    // Step 3: Wait for search results to load
    console.log('3️⃣ Waiting for search results to load...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Step 4: Take screenshot of search results page
    console.log('4️⃣ Taking screenshot of search results...');
    const searchScreenshotResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
    
    if (searchScreenshotResponse.ok) {
      const { screenshot } = await searchScreenshotResponse.json();
      const screenshotPath = path.join(__dirname, 'screenshots', 'search_results.jpg');
      
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(__dirname, 'screenshots');
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
      }
      
      let imageBuffer;
      if (typeof screenshot === 'string') {
        const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = Buffer.from(screenshot);
      }
      
      fs.writeFileSync(screenshotPath, imageBuffer);
      console.log(`💾 Search results screenshot saved to: ${screenshotPath}`);
    }
    
    // Step 5: Get product links from the page
    console.log('5️⃣ Extracting product links...');
    const extractLinksScript = `
      () => {
        const items = document.querySelectorAll('.s-item__link');
        const links = [];
        for (let i = 0; i < Math.min(items.length, ${maxItems}); i++) {
          if (items[i].href && !items[i].href.includes('pulsar.ebay.com')) {
            links.push(items[i].href);
          }
        }
        return links;
      }
    `;
    
    const evaluateResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: extractLinksScript
      })
    });
    
    if (!evaluateResponse.ok) {
      throw new Error(`Failed to extract links: ${evaluateResponse.statusText}`);
    }
    
    const { result: productLinks } = await evaluateResponse.json();
    console.log(`✅ Found ${productLinks.length} product links`);
    
    // Step 6: Visit each product and take screenshots
    for (let i = 0; i < productLinks.length; i++) {
      const productUrl = productLinks[i];
      console.log(`\n📦 Product ${i + 1}/${productLinks.length}`);
      console.log(`   URL: ${productUrl}`);
      
      // Navigate to product page
      console.log(`   ➡️  Navigating to product...`);
      const productNavResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: productUrl
        })
      });
      
      if (!productNavResponse.ok) {
        console.log(`   ⚠️  Failed to navigate to product ${i + 1}`);
        continue;
      }
      
      // Wait for page to load (longer wait for product pages)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Scroll down to load images
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: '() => window.scrollTo(0, 500)'
        })
      });
      
      // Wait a bit more after scrolling
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot
      console.log(`   📸 Taking screenshot...`);
      const productScreenshotResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
      
      if (productScreenshotResponse.ok) {
        const { screenshot } = await productScreenshotResponse.json();
        const screenshotPath = path.join(__dirname, 'screenshots', `product_${i + 1}.jpg`);
        
        let imageBuffer;
        if (typeof screenshot === 'string') {
          const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          imageBuffer = Buffer.from(screenshot);
        }
        
        fs.writeFileSync(screenshotPath, imageBuffer);
        console.log(`   ✅ Screenshot saved: ${screenshotPath}`);
      } else {
        console.log(`   ⚠️  Failed to capture screenshot for product ${i + 1}`);
      }
      
      // Small delay between products
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 7: Close session
    console.log('\n7️⃣ Closing browser session...');
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    
    console.log('\n✅ Done! All screenshots saved successfully.');
    console.log(`📁 Screenshots location: ${path.join(__dirname, 'screenshots')}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const searchQuery = args.join(' ') || 'macbook M3 pro';
const maxItems = 5;

console.log('🔍 eBay Product Screenshot Tool');
console.log('================================');
console.log(`Search Query: "${searchQuery}"`);
console.log(`Max Items: ${maxItems}`);
console.log('================================\n');

// Run the script
searchAndScreenshotEbay(searchQuery, maxItems)
  .then(() => {
    console.log('\n🎉 Screenshot capture completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to capture screenshots:', error);
    process.exit(1);
  });
