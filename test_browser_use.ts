// Test script for Browser-Use integration
import dotenv from 'dotenv';
import { BrowserUseIntegration } from './src/integrations/BrowserUseIntegration';

dotenv.config();

async function testBrowserUse() {
  console.log('🧪 Testing Browser-Use Integration...\n');

  try {
    // Initialize integration
    const browserUse = new BrowserUseIntegration();
    
    // Health check
    console.log('1. Checking health...');
    const health = await browserUse.healthCheck();
    console.log('   Health:', health);
    
    if (!health.healthy) {
      console.error('❌ Bridge service is not healthy. Make sure to start it with: ./start_browser_bridge.sh');
      process.exit(1);
    }
    
    // Test agent run
    console.log('\n2. Running test agent task...');
    const result = await browserUse.runAgent(
      'Go to https://example.com and extract the page title',
      10
    );
    
    console.log('   Result:', JSON.stringify(result, null, 2));
    
    console.log('\n✅ Browser-Use integration test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('\nMake sure the Python bridge is running:');
    console.error('  ./start_browser_bridge.sh');
    process.exit(1);
  }
}

testBrowserUse();
