// Comprehensive test for Browser-Use integration
import dotenv from 'dotenv';
import { BrowserUseIntegration } from './src/integrations/BrowserUseIntegration';

dotenv.config();

async function runComprehensiveTests() {
  console.log('🧪 Running Comprehensive Browser-Use Tests...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browserUse = new BrowserUseIntegration();
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Health Check
  console.log('Test 1: Health Check');
  console.log('─────────────────────');
  try {
    const health = await browserUse.healthCheck();
    if (health.healthy) {
      console.log('✅ PASSED - Bridge is healthy');
      console.log(`   Status: ${JSON.stringify(health)}\n`);
      testsPassed++;
    } else {
      console.log('❌ FAILED - Bridge is unhealthy');
      console.log(`   Error: ${health.error}\n`);
      testsFailed++;
    }
  } catch (error: any) {
    console.log('❌ FAILED - Health check error');
    console.log(`   Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: Simple Agent Task
  console.log('Test 2: Simple Agent Task (Extract page title)');
  console.log('─────────────────────────────────────────────────');
  try {
    const result = await browserUse.runAgent(
      'Go to https://example.com and extract the page title',
      5
    );
    console.log('✅ PASSED - Agent task completed');
    console.log(`   URLs visited: ${result.urls?.length || 0}`);
    console.log(`   Actions taken: ${result.action_names?.join(', ') || 'none'}`);
    console.log(`   Success: ${result.success}\n`);
    testsPassed++;
  } catch (error: any) {
    console.log('❌ FAILED - Agent task error');
    console.log(`   Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: Session Management
  console.log('Test 3: Session Management (Create & Navigate)');
  console.log('───────────────────────────────────────────────');
  let session: any = null;
  try {
    session = await browserUse.newSession({
      headless: true,
      viewport: { width: 1920, height: 1080 }
    });
    console.log('✅ PASSED - Session created');
    console.log(`   Session ID: ${session.sessionId}\n`);
    testsPassed++;
  } catch (error: any) {
    console.log('❌ FAILED - Session creation error');
    console.log(`   Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: Navigation
  if (session) {
    console.log('Test 4: Navigation');
    console.log('──────────────────');
    try {
      await session.navigate('https://example.com');
      console.log('✅ PASSED - Navigation successful');
      console.log(`   URL: https://example.com\n`);
      testsPassed++;
    } catch (error: any) {
      console.log('❌ FAILED - Navigation error');
      console.log(`   Error: ${error.message}\n`);
      testsFailed++;
    }

    // Test 5: Get Current URL
    console.log('Test 5: Get Current URL');
    console.log('───────────────────────');
    try {
      const url = await session.getCurrentUrl();
      console.log('✅ PASSED - Got current URL');
      console.log(`   URL: ${url}\n`);
      testsPassed++;
    } catch (error: any) {
      console.log('❌ FAILED - Get URL error');
      console.log(`   Error: ${error.message}\n`);
      testsFailed++;
    }

    // Test 6: Screenshot
    console.log('Test 6: Take Screenshot');
    console.log('───────────────────────');
    try {
      const screenshot = await session.screenshot();
      console.log('✅ PASSED - Screenshot taken');
      console.log(`   Screenshot size: ${screenshot.length} bytes\n`);
      testsPassed++;
    } catch (error: any) {
      console.log('❌ FAILED - Screenshot error');
      console.log(`   Error: ${error.message}\n`);
      testsFailed++;
    }

    // Test 7: Close Session
    console.log('Test 7: Close Session');
    console.log('─────────────────────');
    try {
      await session.close();
      console.log('✅ PASSED - Session closed\n');
      testsPassed++;
    } catch (error: any) {
      console.log('❌ FAILED - Close session error');
      console.log(`   Error: ${error.message}\n`);
      testsFailed++;
    }
  }

  // Test 8: Complex Agent Task
  console.log('Test 8: Complex Agent Task (Search GitHub)');
  console.log('───────────────────────────────────────────');
  try {
    const result = await browserUse.runAgent(
      'Go to https://github.com and search for "browser-use"',
      10
    );
    console.log('✅ PASSED - Complex agent task completed');
    console.log(`   URLs visited: ${result.urls?.length || 0}`);
    console.log(`   Actions taken: ${result.action_names?.join(', ') || 'none'}`);
    console.log(`   Errors: ${result.errors?.filter((e: any) => e).length || 0}\n`);
    testsPassed++;
  } catch (error: any) {
    console.log('❌ FAILED - Complex agent task error');
    console.log(`   Error: ${error.message}\n`);
    testsFailed++;
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Results Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Browser-Use integration is fully functional.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  }
}

runComprehensiveTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
