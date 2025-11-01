// Test script for new Browser-Use Agent
import 'dotenv/config';
import { BrowserAgent } from './src/agents/browserAgent';
import type { Product } from './src/types';

async function testBrowserAgent() {
  console.log('🧪 Testing Browser-Use Agent Integration\n');

  const agent = new BrowserAgent();

  // Test product
  const testProduct: Product = {
    id: 'test-1',
    title: 'Nintendo Switch OLED - Like New',
    description: 'Nintendo Switch OLED console in excellent condition. Includes original box and accessories. Barely used, like new condition.',
    cost: 250,
    targetPrice: 299,
    category: 'electronics',
    condition: 'like-new',
  };

  try {
    console.log('📦 Test Product:', testProduct.title);
    console.log('💰 Price:', `$${testProduct.targetPrice}\n`);

    console.log('🚀 Creating listings on all platforms...\n');
    console.log('⏱️  This may take 60-90 seconds per platform...\n');

    const results = await agent.createListings(testProduct);

    console.log('\n📊 Results:');
    console.log('✅ Success:', results.success);
    console.log('❌ Failed:', results.failed);
    console.log('\n🔗 URLs:');
    for (const [platform, url] of Object.entries(results.urls)) {
      console.log(`   ${platform}: ${url}`);
    }

    console.log('\n🎉 Test completed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testBrowserAgent();
