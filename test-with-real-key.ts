/**
 * Test Browser-Use with Real OpenAI API Key
 * Full content extraction test
 */

import dotenv from 'dotenv';
dotenv.config();

async function testFullExtraction() {
  console.log('\n🚀 Browser-Use Full Extraction Test');
  console.log('=' .repeat(70));
  
  const { BrowserUseIntegration } = await import('./src/integrations/BrowserUseIntegration');
  const apiKey = process.env.OPENAI_API_KEY || '';
  
  console.log('\n📋 Configuration:');
  console.log('   API Key:', apiKey ? `✅ Loaded (${apiKey.substring(0, 20)}...)` : '❌ Not loaded');
  console.log('   Bridge: http://localhost:8001\n');
  
  const browserUse = new BrowserUseIntegration(apiKey);
  
  console.log('🤖 Running Full Extraction Task...');
  console.log('   Task: Extract structured data from example.com\n');
  
  const result = await browserUse.runAgent({
    task: `Navigate to https://example.com. Wait for the page to fully load.
Extract the following information as a structured JSON object:
1. Page title (from the <title> tag)
2. Main heading text (from the <h1> element)
3. First paragraph text (from the first <p> element)

Return ONLY a JSON object with these three fields.`,
    maxSteps: 25,
    extractSchema: {
      title: { type: 'string' },
      heading: { type: 'string' },
      paragraph: { type: 'string' }
    },
    headless: true,
    useVision: 'auto'
  });
  
  console.log('\n📊 Results:');
  console.log('   Success:', result.success ? '✅' : '❌');
  console.log('   Steps:', result.history?.steps);
  console.log('   Duration:', result.history?.duration_seconds?.toFixed(2), 'seconds');
  console.log('   URLs:', result.history?.urls?.length);
  
  if (result.extracted_content) {
    console.log('\n✅ EXTRACTED CONTENT:');
    console.log(JSON.stringify(result.extracted_content, null, 2));
  }
  
  if (result.final_result) {
    console.log('\n✅ FINAL RESULT:');
    console.log(JSON.stringify(result.final_result, null, 2));
  }
  
  if (result.error) {
    console.log('\n⚠️  Error:', result.error);
  }
  
  console.log('\n' + '='.repeat(70));
  if (result.extracted_content || result.final_result) {
    console.log('🎉 SUCCESS: Content extraction working with real API key!');
  } else {
    console.log('⚠️  No content extracted - check agent execution logs');
  }
  console.log('='.repeat(70));
}

testFullExtraction().catch(console.error);

