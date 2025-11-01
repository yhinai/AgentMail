/**
 * Script to take a screenshot of eBay using the browser-use Python bridge
 */

async function takeEbayScreenshot() {
  const BRIDGE_URL = 'http://localhost:8001';
  
  try {
    console.log('📸 Starting eBay screenshot capture...');
    
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
    
    // Step 2: Navigate to eBay
    console.log('2️⃣ Navigating to eBay.com...');
    const navigateResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.ebay.com'
      })
    });
    
    if (!navigateResponse.ok) {
      throw new Error(`Failed to navigate: ${navigateResponse.statusText}`);
    }
    
    console.log('✅ Navigated to eBay');
    
    // Step 3: Wait a moment for page to load
    console.log('3️⃣ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Take screenshot
    console.log('4️⃣ Taking screenshot...');
    const screenshotResponse = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/screenshot`);
    
    if (!screenshotResponse.ok) {
      throw new Error(`Failed to take screenshot: ${screenshotResponse.statusText}`);
    }
    
    const { screenshot } = await screenshotResponse.json();
    console.log('✅ Screenshot captured!');
    
    // Step 5: Save screenshot to file
    const fs = require('fs');
    const path = require('path');
    
    // Screenshot is returned as base64, decode and save
    const screenshotPath = path.join(__dirname, 'ebay_screenshot.jpg');
    
    // If screenshot is base64 string, decode it
    let imageBuffer;
    if (typeof screenshot === 'string') {
      // Remove data URL prefix if present
      const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      imageBuffer = Buffer.from(screenshot);
    }
    
    fs.writeFileSync(screenshotPath, imageBuffer);
    console.log(`💾 Screenshot saved to: ${screenshotPath}`);
    
    // Step 6: Close session
    console.log('5️⃣ Closing browser session...');
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    
    console.log('✅ Done! Screenshot saved successfully.');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the script
takeEbayScreenshot()
  .then(() => {
    console.log('🎉 Screenshot capture completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to capture screenshot:', error);
    process.exit(1);
  });
