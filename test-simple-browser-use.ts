/**
 * Simple test script for Browser-Use Integration
 * Tests basic connectivity and integration without full dependencies
 */

import dotenv from 'dotenv';
dotenv.config();

// Set minimal required environment variables for testing
process.env.BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || 'test-key';
process.env.AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY || 'test-key';
process.env.HYPERSPELL_API_KEY = process.env.HYPERSPELL_API_KEY || 'test-key';
process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-key';
process.env.COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'test-key';

async function testBasicIntegration() {
  console.log('\n🧪 Simple Browser-Use Integration Test');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Import BrowserUseIntegration
    console.log('\n1. Testing BrowserUseIntegration import...');
    const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
    console.log('✅ BrowserUseIntegration imported successfully');
    
    // Test 2: Create instance
    console.log('\n2. Creating BrowserUseIntegration instance...');
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    console.log('✅ Instance created');
    console.log(`   Bridge URL: ${(browserUse as any).bridgeUrl || 'not set'}`);
    
    // Test 3: Health check
    console.log('\n3. Testing health check...');
    try {
      const health = await browserUse.healthCheck();
      console.log('Health check result:', health);
      
      if (health.healthy) {
        console.log('✅ Bridge service is running and healthy');
      } else {
        console.log('⚠️  Bridge service health check failed:', health.error);
        console.log('   To start the bridge service:');
        console.log('   cd python_bridge && python browser_service.py');
      }
    } catch (error: any) {
      console.log('⚠️  Health check error:', error.message);
      console.log('   This is expected if the Python bridge is not running');
    }
    
    // Test 4: Check if runAgent method exists
    console.log('\n4. Checking runAgent method...');
    if (typeof browserUse.runAgent === 'function') {
      console.log('✅ runAgent method available');
    } else {
      console.log('❌ runAgent method not found');
    }
    
    // Test 5: Check if extractContent method exists
    console.log('\n5. Checking extractContent method...');
    if (typeof browserUse.extractContent === 'function') {
      console.log('✅ extractContent method available');
    } else {
      console.log('❌ extractContent method not found');
    }
    
    console.log('\n✅ Basic integration test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Install Python dependencies: pip install -r requirements.txt');
    console.log('   2. Start Python bridge: cd python_bridge && python browser_service.py');
    console.log('   3. Set OPENAI_API_KEY or BROWSER_USE_API_KEY environment variable');
    console.log('   4. Run full test: npx tsx test-browser-use-integration.ts');
    
    return true;
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testBasicIntegration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

