// Quick test script for AgentMail API connection
import axios from 'axios';
import * as dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;
const AGENTMAIL_API_URL = process.env.AGENTMAIL_API_URL || 'https://api.agentmail.to/v0';

// For testing: disable SSL verification (REMOVE IN PRODUCTION!)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testAgentMailConnection() {
  console.log('🔍 Testing AgentMail API Connection...\n');

  if (!AGENTMAIL_API_KEY) {
    console.error('❌ AGENTMAIL_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log(`📧 API URL: ${AGENTMAIL_API_URL}`);
  console.log(`🔑 API Key: ${AGENTMAIL_API_KEY.substring(0, 10)}...${AGENTMAIL_API_KEY.substring(AGENTMAIL_API_KEY.length - 10)}\n`);

  try {
    // Test 1: Check authentication / health
    console.log('Test 1: Checking API availability...');

    // Try different endpoints
    const endpoints = [
      '/health',
      '/account',
      '/messages',
      '/messages/unread',
      '/',
    ];

    let successfulEndpoint = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`   Trying ${endpoint}...`);
        const response = await axios.get(`${AGENTMAIL_API_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          httpsAgent,
          timeout: 5000,
        });

        console.log(`   ✅ Success on ${endpoint}`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        successfulEndpoint = endpoint;
        break;
      } catch (err: any) {
        console.log(`   ❌ Failed on ${endpoint}: ${err.response?.status || err.message}`);
      }
    }

    if (successfulEndpoint) {
      console.log('\n🎉 AgentMail API connection successful!');
      console.log(`✅ Working endpoint: ${successfulEndpoint}\n`);
    } else {
      console.log('\n⚠️  Could not find a working endpoint.');
      console.log('This might be because:');
      console.log('1. The API is not yet deployed');
      console.log('2. The API key is incorrect');
      console.log('3. The base URL needs to be different\n');
      console.log('💡 For hackathon: We\'ll proceed with a mock implementation');
    }

  } catch (error: any) {
    console.error('❌ AgentMail API Test Failed\n');

    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }

    process.exit(1);
  }
}

testAgentMailConnection();
