/**
 * Quick test to see what we can extract from agentmail.to
 */

const BRIDGE_URL = 'http://localhost:8001';

async function testAgentMailScrape() {
  console.log('🧪 Testing agentmail.to scraping\n');
  
  let sessionId: string | null = null;
  
  try {
    // Create session
    console.log('1. Creating browser session...');
    const sessionResp = await fetch(`${BRIDGE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headless: true, viewport: { width: 1920, height: 1080 } })
    });
    
    const { sessionId: sid } = await sessionResp.json();
    sessionId = sid;
    console.log(`✅ Session: ${sessionId}\n`);
    
    // Navigate
    console.log('2. Navigating to agentmail.to...');
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://agentmail.to' })
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Page loaded\n');
    
    // Extract ALL text that looks like prices
    console.log('3. Extracting prices...');
    const priceScript = `
      () => {
        const allText = document.body.innerText;
        const priceMatches = allText.match(/\\$[\\d,]+(?:\\.\\d{2})?|€[\\d,]+(?:\\.\\d{2})?|£[\\d,]+(?:\\.\\d{2})?/g);
        return JSON.stringify({
          foundPrices: priceMatches || [],
          pageTitle: document.title,
          h1Text: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()),
          h2Text: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).slice(0, 5)
        });
      }
    `;
    
    const evalResp = await fetch(`${BRIDGE_URL}/sessions/${sessionId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: priceScript })
    });
    
    const { result } = await evalResp.json();
    const data = JSON.parse(result);
    
    console.log('Page Title:', data.pageTitle);
    console.log('H1 Headings:', data.h1Text);
    console.log('H2 Headings:', data.h2Text);
    console.log('Found Prices:', data.foundPrices);
    console.log('Total Prices Found:', data.foundPrices.length);
    
    // Close
    await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
    
    console.log('\n✅ Test complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (sessionId) {
      await fetch(`${BRIDGE_URL}/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

testAgentMailScrape()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
