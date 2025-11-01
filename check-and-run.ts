/**
 * Check for API keys and run integration test
 */

import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
dotenv.config();

const envPath = path.join(process.cwd(), '.env');

console.log('\n🔍 Checking API Keys Configuration...');
console.log('=' .repeat(70));

// Read .env file
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf-8');
} catch {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Check for keys
const openaiLine = envContent.split('\n').find(line => line.startsWith('OPENAI_API_KEY='));
const browserUseLine = envContent.split('\n').find(line => line.startsWith('BROWSER_USE_API_KEY='));

const openaiKey = openaiLine?.split('=')[1]?.trim() || '';
const browserUseKey = browserUseLine?.split('=')[1]?.trim() || '';

console.log('\n📋 Found in .env file:');
console.log('   OPENAI_API_KEY:', openaiKey ? (openaiKey.length > 20 && !openaiKey.includes('your_') ? `✅ Valid key (${openaiKey.substring(0, 10)}...)` : `⚠️  Placeholder or invalid: "${openaiKey.substring(0, 20)}..."`) : '❌ Not set');
console.log('   BROWSER_USE_API_KEY:', browserUseKey ? (browserUseKey.length > 20 && !browserUseKey.includes('your_') ? `✅ Valid key (${browserUseKey.substring(0, 10)}...)` : `⚠️  Placeholder or invalid: "${browserUseKey.substring(0, 20)}..."`) : '❌ Not set');

// Check actual env vars (may be set externally)
const envOpenAI = process.env.OPENAI_API_KEY;
const envBrowserUse = process.env.BROWSER_USE_API_KEY;

console.log('\n📋 From environment variables:');
console.log('   OPENAI_API_KEY:', envOpenAI ? (envOpenAI.length > 20 ? `✅ Valid (${envOpenAI.substring(0, 10)}...)` : '⚠️  Too short') : '❌ Not set');
console.log('   BROWSER_USE_API_KEY:', envBrowserUse ? (envBrowserUse.length > 20 ? `✅ Valid (${envBrowserUse.substring(0, 10)}...)` : '⚠️  Too short') : '❌ Not set');

const validKey = (envBrowserUse && envBrowserUse.length > 20 && !envBrowserUse.includes('your_')) 
  || (envOpenAI && envOpenAI.length > 20 && !envOpenAI.includes('your_'));

if (!validKey) {
  console.log('\n❌ No valid API keys found!');
  console.log('\n💡 To add your API keys:');
  console.log('   1. Open .env file');
  console.log('   2. Replace placeholder values with your actual keys:');
  console.log('      OPENAI_API_KEY=sk-your-actual-key-here');
  console.log('      BROWSER_USE_API_KEY=your-actual-key-here');
  console.log('   3. Save the file');
  console.log('   4. Run this script again');
  process.exit(1);
}

// Use the valid key
const apiKey = (envBrowserUse && envBrowserUse.length > 20 && !envBrowserUse.includes('your_')) 
  ? envBrowserUse 
  : envOpenAI;

console.log('\n✅ Valid API key found! Running integration test...');
console.log('=' .repeat(70));

// Now run the test
import('./run-full-integration').then(() => {
  // Import and run
}).catch(() => {
  // Fallback - run inline
  (async () => {
    const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
    const axios = require('axios');
    
    console.log('\n1️⃣  Testing Bridge Service...');
    const health = await axios.get('http://localhost:8001/health');
    console.log('   ✅ Bridge healthy');
    
    console.log('\n2️⃣  Running Browser-Use Agent...');
    const browserUse = new BrowserUseIntegration(apiKey);
    
    const result = await browserUse.runAgent({
      task: 'Navigate to https://example.com. Wait for page load. Extract: 1) Page title, 2) Main heading text. Return as JSON.',
      maxSteps: 20,
      extractSchema: {
        title: { type: 'string' },
        heading: { type: 'string' }
      },
      headless: true
    });
    
    console.log('\n   Results:');
    console.log('   - Success:', result.success);
    console.log('   - Steps:', result.history?.steps);
    console.log('   - Duration:', result.history?.duration_seconds?.toFixed(2), 'seconds');
    
    if (result.extracted_content) {
      console.log('\n   ✅ EXTRACTED DATA:');
      console.log(JSON.stringify(result.extracted_content, null, 2));
    }
    
    console.log('\n🎉 Test Complete!');
  })();
});

