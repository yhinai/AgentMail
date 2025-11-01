/**
 * Script to search eBay for products and take screenshots using browser-use agent
 */

async function searchAndScreenshotWithAgent(searchQuery: string) {
  const BRIDGE_URL = 'http://localhost:8001';
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📸 Starting eBay product screenshot capture for: "${searchQuery}"`);
    console.log('Using browser-use AI agent for intelligent navigation...\n');
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
    
    // Task for the AI agent
    const task = `
Go to eBay.com and search for "${searchQuery}".
Wait for the search results to load.
Take note of the first 3 product listings.
For each of the first 3 products:
1. Click on the product link to open the product page
2. Wait for the product page to fully load (wait 5 seconds)
3. Scroll down slightly to see the product details
4. Note the product title and price
Return a summary of the products you found with their titles and prices.
`;
    
    console.log('🤖 Running browser-use agent...');
    console.log('Task:', task);
    console.log('\nThis will take about 1-2 minutes...\n');
    
    // Run the agent
    const response = await fetch(`${BRIDGE_URL}/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: task,
        max_steps: 30
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Agent failed: ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ Agent completed!');
    console.log('\n📊 Results:');
    console.log('- Success:', result.success);
    console.log('- URLs visited:', result.urls?.length || 0);
    console.log('- Actions performed:', result.action_names?.length || 0);
    
    if (result.urls && result.urls.length > 0) {
      console.log('\n🔗 URLs visited:');
      result.urls.forEach((url: string, i: number) => {
        console.log(`   ${i + 1}. ${url}`);
      });
    }
    
    if (result.action_names && result.action_names.length > 0) {
      console.log('\n⚡ Actions performed:');
      result.action_names.forEach((action: string, i: number) => {
        console.log(`   ${i + 1}. ${action}`);
      });
    }
    
    if (result.final_result) {
      console.log('\n📝 Final Result:');
      console.log(result.final_result);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach((error: string) => {
        console.log(`   - ${error}`);
      });
    }
    
    // Now take manual screenshots of the products
    console.log('\n\n📸 Now taking manual screenshots of each product...');
    
    // Create a new session for screenshots
    const sessionResponse = await fetch(`${BRIDGE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headless: false,
        viewport: { width: 1920, height: 1080 }
      })
    });
    
    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
    }
    
    const { sessionId } = await sessionResponse.json();
    console.log(`✅ Session created: ${sessionId}`);
    
    // Navigate to search results
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`;
    console.log(`\n🔍 Navigating to: ${searchUrl}`);
    
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: searchUrl })
    });
    
    // Wait for page load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take screenshot of search results
    console.log('📸 Taking screenshot of search results...');
    const searchScreenshot = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
    if (searchScreenshot.ok) {
      const { screenshot } = await searchScreenshot.json();
      const screenshotPath = path.join(screenshotsDir, 'search_results.jpg');
      
      let imageBuffer;
      if (typeof screenshot === 'string') {
        const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        imageBuffer = Buffer.from(screenshot);
      }
      
      fs.writeFileSync(screenshotPath, imageBuffer);
      console.log(`✅ Saved: ${screenshotPath}`);
    }
    
    // Get product links using a more robust selector
    console.log('\n🔗 Extracting product links...');
    const extractScript = `
      () => {
        const links = [];
        // Try multiple selectors for eBay product links
        const selectors = [
          '.s-item__link',
          'a.s-item__link',
          '.srp-results .s-item a[href*="/itm/"]'
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (let i = 0; i < Math.min(elements.length, 3); i++) {
            const href = elements[i].href;
            if (href && href.includes('/itm/') && !href.includes('pulsar')) {
              links.push(href);
            }
          }
          if (links.length >= 3) break;
        }
        
        return [...new Set(links)].slice(0, 3);
      }
    `;
    
    const evalResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: extractScript })
    });
    
    let productLinks: string[] = [];
    if (evalResponse.ok) {
      const { result: links } = await evalResponse.json();
      productLinks = links || [];
      console.log(`✅ Found ${productLinks.length} product links`);
    }
    
    // Visit each product and take screenshot
    for (let i = 0; i < productLinks.length; i++) {
      const productUrl = productLinks[i];
      console.log(`\n📦 Product ${i + 1}/${productLinks.length}`);
      console.log(`   URL: ${productUrl}`);
      
      // Navigate to product
      console.log(`   ➡️  Navigating...`);
      const navResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      });
      
      if (!navResponse.ok) {
        console.log(`   ⚠️  Failed to navigate`);
        continue;
      }
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Scroll to load images
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: '() => window.scrollTo(0, 400)' })
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot
      console.log(`   📸 Taking screenshot...`);
      const screenshotResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
      
      if (screenshotResponse.ok) {
        const { screenshot } = await screenshotResponse.json();
        const screenshotPath = path.join(screenshotsDir, `product_${i + 1}.jpg`);
        
        let imageBuffer;
        if (typeof screenshot === 'string') {
          const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          imageBuffer = Buffer.from(screenshot);
        }
        
        fs.writeFileSync(screenshotPath, imageBuffer);
        console.log(`   ✅ Saved: ${screenshotPath}`);
      }
    }
    
    // Close session
    console.log('\n🔒 Closing browser session...');
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    
    console.log('\n✅ All done!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const searchQuery = args.join(' ') || 'macbook M3 pro';

console.log('🔍 eBay Product Screenshot Tool (with AI Agent)');
console.log('================================================');
console.log(`Search Query: "${searchQuery}"`);
console.log('================================================\n');

// Run the script
searchAndScreenshotWithAgent(searchQuery)
  .then(() => {
    console.log('\n🎉 Screenshot capture completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
