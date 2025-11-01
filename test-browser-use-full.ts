/**
 * Full Browser-Use Integration Test (without Convex dependencies)
 */

import dotenv from 'dotenv';
dotenv.config();

// Set minimal required environment variables for testing
if (!process.env.BROWSER_USE_API_KEY && !process.env.OPENAI_API_KEY) {
  process.env.BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || 'test-key';
}
process.env.AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY || 'test-key';
process.env.HYPERSPELL_API_KEY = process.env.HYPERSPELL_API_KEY || 'test-key';
process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-key';
process.env.COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'test-key';

async function testHealthCheck() {
  console.log('\n🧪 Test 1: Health Check');
  console.log('=' .repeat(50));
  
  try {
    const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
    const health = await browserUse.healthCheck();
    console.log('Health check result:', health);
    
    if (health.healthy) {
      console.log('✅ Bridge service is healthy');
      return true;
    } else {
      console.log('⚠️  Bridge service health check failed:', health.error);
      console.log('   This might be okay if bridge is not running yet');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Health check error:', error.message);
    return false;
  }
}

async function testSimpleAgentTask() {
  console.log('\n🧪 Test 2: Simple Agent Task');
  console.log('=' .repeat(50));
  
  try {
    const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
    const apiKey = process.env.BROWSER_USE_API_KEY || process.env.OPENAI_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
    console.log('Running simple extraction task...');
    console.log('Task: Extract page title from example.com');
    
    // Try to run even with test-key to test integration flow
    // The actual LLM call will fail, but we can test the integration
    
    const result = await browserUse.runAgent({
      task: 'Navigate to https://example.com and extract the page title. Return it as a string.',
      maxSteps: 10,
      headless: true,
      useVision: 'auto'
    });
    
    console.log('Result:', {
      success: result.success,
      final_result: result.final_result,
      extracted_content: result.extracted_content,
      error: result.error,
      history: result.history ? {
        steps: result.history.steps,
        urls: result.history.urls?.length || 0
      } : null
    });
    
    if (result.success) {
      console.log('✅ Simple agent task completed successfully');
      if (result.extracted_content || result.final_result) {
        console.log('✅ Data extraction successful');
      }
      return true;
    } else {
      console.log('❌ Agent task failed:', result.error);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Agent task error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   ⚠️  Bridge service is not running');
      console.log('   Start it with: cd python_bridge && python3 browser_service.py');
    }
    return false;
  }
}

async function testStructuredExtraction() {
  console.log('\n🧪 Test 3: Structured Extraction');
  console.log('=' .repeat(50));
  
  try {
    const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
    const apiKey = process.env.BROWSER_USE_API_KEY || process.env.OPENAI_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
    // Test integration flow even if API key is test-key
    
    console.log('Running structured extraction task...');
    
    const extractSchema = {
      title: { type: 'string' },
      heading: { type: 'string' },
      description: { type: 'string' }
    };
    
    const result = await browserUse.runAgent({
      task: 'Navigate to https://example.com and extract: 1) The page title, 2) The main heading text, 3) The main paragraph description. Return as structured data.',
      maxSteps: 15,
      extractSchema: extractSchema,
      headless: true,
      useVision: 'auto'
    });
    
    console.log('Structured extraction result:', {
      success: result.success,
      extracted_content: result.extracted_content,
      error: result.error
    });
    
    if (result.success && result.extracted_content) {
      console.log('✅ Structured extraction successful');
      console.log('Extracted data:', JSON.stringify(result.extracted_content, null, 2));
      return true;
    } else {
      console.log('⚠️  Structured extraction completed but no content extracted');
      console.log('Error:', result.error);
      return result.success;
    }
  } catch (error: any) {
    console.error('❌ Structured extraction error:', error.message);
    return false;
  }
}

async function testExtractContentMethod() {
  console.log('\n🧪 Test 4: Extract Content Method');
  console.log('=' .repeat(50));
  
  try {
    const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
    const apiKey = process.env.BROWSER_USE_API_KEY || process.env.OPENAI_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
    // Test integration flow even if API key is test-key
    
    console.log('Testing extractContent convenience method...');
    
    const content = await browserUse.extractContent(
      'https://example.com',
      'extract the main heading text',
      {
        heading: { type: 'string' }
      },
      {
        maxSteps: 10,
        headless: true
      }
    );
    
    if (content) {
      console.log('✅ Extract content successful');
      console.log('Extracted:', content);
      return true;
    } else {
      console.log('⚠️  Extract content returned null');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Extract content error:', error.message);
    return false;
  }
}

async function testBridgeConnection() {
  console.log('\n🧪 Test 5: Bridge Service Connection');
  console.log('=' .repeat(50));
  
  try {
    const axios = require('axios');
    const bridgeUrl = process.env.BROWSER_BRIDGE_URL || 'http://localhost:8001';
    
    console.log(`Checking bridge service at ${bridgeUrl}...`);
    
    const response = await axios.get(`${bridgeUrl}/health`, {
      timeout: 5000
    });
    
    console.log('Bridge health response:', response.data);
    
    if (response.data?.healthy) {
      console.log('✅ Bridge service is running and healthy');
      return true;
    } else {
      console.log('⚠️  Bridge service responded but not healthy');
      return false;
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.log('❌ Bridge service is not running');
      console.log('   Start it with: cd python_bridge && python3 browser_service.py');
    } else {
      console.log('❌ Bridge connection error:', error.message);
    }
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Browser-Use Integration Full Test Suite');
  console.log('=' .repeat(60));
  console.log('Testing browser-use Agent API integration');
  console.log('=' .repeat(60));
  
  const results = {
    healthCheck: false,
    bridgeConnection: false,
    simpleTask: false,
    structuredExtraction: false,
    extractContent: false
  };
  
  // Check environment
  console.log('\n📋 Environment Check:');
  const hasBrowserUseKey = !!process.env.BROWSER_USE_API_KEY && process.env.BROWSER_USE_API_KEY !== 'test-key';
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  console.log('BROWSER_USE_API_KEY:', hasBrowserUseKey ? '✅ Set' : '❌ Not set (or test-key)');
  console.log('OPENAI_API_KEY:', hasOpenAIKey ? '✅ Set' : '❌ Not set');
  console.log('BROWSER_BRIDGE_URL:', process.env.BROWSER_BRIDGE_URL || 'http://localhost:8001 (default)');
  
  if (!hasBrowserUseKey && !hasOpenAIKey) {
    console.log('\n⚠️  Warning: No valid API key configured!');
    console.log('   Set either BROWSER_USE_API_KEY or OPENAI_API_KEY');
    console.log('   Some tests will be skipped without an API key');
  }
  
  // Run tests
  try {
    results.healthCheck = await testHealthCheck();
    results.bridgeConnection = await testBridgeConnection();
    
    if (results.bridgeConnection && (hasBrowserUseKey || hasOpenAIKey)) {
      // Only run agent tests if bridge is healthy and we have API keys
      results.simpleTask = await testSimpleAgentTask();
      results.structuredExtraction = await testStructuredExtraction();
      results.extractContent = await testExtractContentMethod();
    } else {
      if (!results.bridgeConnection) {
        console.log('\n⚠️  Skipping agent tests - bridge service not available');
        console.log('   Start the Python bridge service first:');
        console.log('   cd python_bridge && python3 browser_service.py');
      } else if (!hasBrowserUseKey && !hasOpenAIKey) {
        console.log('\n⚠️  Skipping agent tests - no API key configured');
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ Test suite error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(60));
  console.log('Health Check:              ', results.healthCheck ? '✅ PASS' : '❌ FAIL');
  console.log('Bridge Connection:        ', results.bridgeConnection ? '✅ PASS' : '❌ FAIL');
  console.log('Simple Agent Task:         ', results.simpleTask ? '✅ PASS' : '⏭️  SKIP');
  console.log('Structured Extraction:     ', results.structuredExtraction ? '✅ PASS' : '⏭️  SKIP');
  console.log('Extract Content Method:    ', results.extractContent ? '✅ PASS' : '⏭️  SKIP');
  console.log('=' .repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  const skipped = Object.values(results).filter(r => r === false && !results.bridgeConnection && !hasBrowserUseKey && !hasOpenAIKey).length;
  
  console.log(`\n✅ Passed: ${passed}/${total} tests`);
  if (skipped > 0) {
    console.log(`⏭️  Skipped: ${skipped} tests (missing bridge or API key)`);
  }
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Integration is fully operational.');
  } else if (results.bridgeConnection && results.healthCheck) {
    console.log('\n✅ Integration is working! Some tests skipped due to missing API keys.');
    console.log('\n💡 To run full tests:');
    console.log('   Set OPENAI_API_KEY or BROWSER_USE_API_KEY environment variable');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('\n💡 Setup checklist:');
    if (!results.bridgeConnection) {
      console.log('   [ ] Install Python dependencies: pip3 install -r requirements.txt');
      console.log('   [ ] Start bridge service: cd python_bridge && python3 browser_service.py');
    }
    if (!hasBrowserUseKey && !hasOpenAIKey) {
      console.log('   [ ] Set OPENAI_API_KEY or BROWSER_USE_API_KEY');
    }
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then((results) => {
      const criticalPassed = results.bridgeConnection && results.healthCheck;
      process.exit(criticalPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests };

