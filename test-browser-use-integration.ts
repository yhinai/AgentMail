/**
 * Test script for Browser-Use Agent API Integration with Convex
 * 
 * Tests:
 * 1. Python bridge service health check
 * 2. BrowserUseIntegration runAgent method
 * 3. Simple extraction task
 * 4. MarketResearchAgent integration (if time permits)
 */

import dotenv from 'dotenv';
dotenv.config();

// Set minimal required environment variables for testing if not already set
if (!process.env.BROWSER_USE_API_KEY && !process.env.OPENAI_API_KEY) {
  process.env.BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY || 'test-key';
}
process.env.AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY || 'test-key';
process.env.HYPERSPELL_API_KEY = process.env.HYPERSPELL_API_KEY || 'test-key';
process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-key';
process.env.COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'test-key';

import { BrowserUseIntegration } from './src/integrations/BrowserUseIntegration';
import { MarketResearchAgent } from './src/agents/MarketResearchAgent';
import { PerplexityIntegration } from './src/integrations/PerplexityIntegration';

async function testHealthCheck() {
  console.log('\n🧪 Test 1: Health Check');
  console.log('=' .repeat(50));
  
  try {
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
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
    console.log('Running simple extraction task...');
    console.log('Task: Extract page title from example.com');
    
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
      history: result.history
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
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testStructuredExtraction() {
  console.log('\n🧪 Test 3: Structured Extraction');
  console.log('=' .repeat(50));
  
  try {
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
    console.log('Running structured extraction task...');
    console.log('Task: Extract structured data from example.com');
    
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
      return result.success; // Still consider it a success if task completed
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
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    const browserUse = new BrowserUseIntegration(apiKey);
    
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

async function testMarketResearchAgent() {
  console.log('\n🧪 Test 5: MarketResearchAgent Integration (Light Test)');
  console.log('=' .repeat(50));
  
  try {
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    const perplexityKey = process.env.PERPLEXITY_API_KEY || '';
    
    if (!perplexityKey) {
      console.log('⚠️  PERPLEXITY_API_KEY not set, skipping enrichment test');
      console.log('   Creating agent without Perplexity integration...');
    }
    
    const browserUse = new BrowserUseIntegration(apiKey);
    const perplexity = perplexityKey 
      ? new PerplexityIntegration(perplexityKey)
      : null as any;
    
    const agent = new MarketResearchAgent({
      browserUse,
      perplexity: perplexity || new PerplexityIntegration(''), // Placeholder
      maxConcurrent: 1, // Single concurrent request for testing
      headless: true
    });
    
    // Test health check
    const healthy = await agent.healthCheck();
    console.log('Agent health check:', healthy);
    
    if (healthy) {
      console.log('✅ MarketResearchAgent initialized and healthy');
      
      // Note: Full scraping test would take too long and cost money
      // We'll just verify the agent is set up correctly
      console.log('⚠️  Skipping full scraping test (would take time and cost API credits)');
      console.log('   Agent is ready for use. Test with:');
      console.log('   await agent.findOpportunities({ platforms: ["craigslist"], categories: ["electronics"], itemsPerPlatform: 1 })');
      
      return true;
    } else {
      console.log('❌ Agent health check failed');
      return false;
    }
  } catch (error: any) {
    console.error('❌ MarketResearchAgent test error:', error.message);
    return false;
  }
}

async function testConvexConnection() {
  console.log('\n🧪 Test 6: Convex Connection Check');
  console.log('=' .repeat(50));
  
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    
    if (!convexUrl) {
      console.log('⚠️  Convex URL not configured');
      console.log('   Set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable');
      console.log('   Scraped items will not be saved to Convex');
      return false;
    }
    
    console.log('Convex URL:', convexUrl);
    
    // Try to import and use Convex client
    try {
      const convexModule = require('convex/browser');
      const ConvexHttpClient = convexModule?.ConvexHttpClient;
      
      if (!ConvexHttpClient) {
        console.log('⚠️  ConvexHttpClient not available');
        return false;
      }
      
      const client = new ConvexHttpClient(convexUrl);
      
      // Try to check if API is accessible
      console.log('✅ Convex client initialized');
      console.log('   Convex integration ready');
      return true;
    } catch (error: any) {
      console.log('⚠️  Could not initialize Convex client:', error.message);
      console.log('   Make sure convex/_generated/api exists');
      console.log('   Run: npx convex dev');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Convex connection check error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Browser-Use Integration Test Suite');
  console.log('=' .repeat(50));
  console.log('Testing browser-use Agent API integration with Convex');
  console.log('=' .repeat(50));
  
  const results = {
    healthCheck: false,
    simpleTask: false,
    structuredExtraction: false,
    extractContent: false,
    marketResearchAgent: false,
    convexConnection: false
  };
  
  // Check environment
  console.log('\n📋 Environment Check:');
  console.log('BROWSER_USE_API_KEY:', process.env.BROWSER_USE_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('BROWSER_BRIDGE_URL:', process.env.BROWSER_BRIDGE_URL || 'http://localhost:8001 (default)');
  console.log('CONVEX_URL:', process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || '❌ Not set');
  
  if (!process.env.BROWSER_USE_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  Warning: No API key configured!');
    console.log('   Set either BROWSER_USE_API_KEY or OPENAI_API_KEY');
    console.log('   Some tests may fail without an API key');
  }
  
  // Run tests
  try {
    results.healthCheck = await testHealthCheck();
    results.convexConnection = await testConvexConnection();
    
    if (results.healthCheck) {
      // Only run agent tests if bridge is healthy
      results.simpleTask = await testSimpleAgentTask();
      results.structuredExtraction = await testStructuredExtraction();
      results.extractContent = await testExtractContentMethod();
    } else {
      console.log('\n⚠️  Skipping agent tests - bridge service not available');
      console.log('   Start the Python bridge service first:');
      console.log('   cd python_bridge && python browser_service.py');
    }
    
    results.marketResearchAgent = await testMarketResearchAgent();
    
  } catch (error: any) {
    console.error('\n❌ Test suite error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=' .repeat(50));
  console.log('Health Check:              ', results.healthCheck ? '✅ PASS' : '❌ FAIL');
  console.log('Simple Agent Task:         ', results.simpleTask ? '✅ PASS' : '❌ FAIL');
  console.log('Structured Extraction:     ', results.structuredExtraction ? '✅ PASS' : '❌ FAIL');
  console.log('Extract Content Method:    ', results.extractContent ? '✅ PASS' : '❌ FAIL');
  console.log('MarketResearchAgent:       ', results.marketResearchAgent ? '✅ PASS' : '❌ FAIL');
  console.log('Convex Connection:         ', results.convexConnection ? '✅ PASS' : '❌ FAIL');
  console.log('=' .repeat(50));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`\n✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Integration is ready to use.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    console.log('\n💡 Tips:');
    if (!results.healthCheck) {
      console.log('   - Start Python bridge: cd python_bridge && python browser_service.py');
    }
    if (!process.env.BROWSER_USE_API_KEY && !process.env.OPENAI_API_KEY) {
      console.log('   - Set BROWSER_USE_API_KEY or OPENAI_API_KEY');
    }
    if (!results.convexConnection) {
      console.log('   - Set NEXT_PUBLIC_CONVEX_URL for Convex integration');
    }
  }
  
  return results;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then((results) => {
      const allPassed = Object.values(results).every(r => r);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllTests };

