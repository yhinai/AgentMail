// AgentMail API Connection Test - Corrected Version
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;
const AGENTMAIL_API_URL = process.env.AGENTMAIL_API_URL || 'https://api.agentmail.to/v0';

async function testAgentMailAPI() {
  console.log('🔍 Testing AgentMail API Connection\n');

  if (!AGENTMAIL_API_KEY) {
    console.error('❌ AGENTMAIL_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log(`📧 API URL: ${AGENTMAIL_API_URL}`);
  console.log(`🔑 API Key: ${AGENTMAIL_API_KEY.substring(0, 10)}...${AGENTMAIL_API_KEY.substring(AGENTMAIL_API_KEY.length - 10)}\n`);

  const client = axios.create({
    baseURL: AGENTMAIL_API_URL,
    headers: {
      'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  try {
    // Test 1: List inboxes
    console.log('Test 1: List inboxes');
    const inboxesResponse = await client.get('/inboxes');
    console.log('✅ Success!');
    console.log(`   Found ${inboxesResponse.data.count} inbox(es)`);
    if (inboxesResponse.data.inboxes?.length > 0) {
      console.log('   Inboxes:', JSON.stringify(inboxesResponse.data.inboxes, null, 2));
    } else {
      console.log('   ℹ️  No inboxes yet - you\'ll need to create one\n');
    }

    // Test 2: Try listing pods (if supported)
    console.log('Test 2: List pods (if API supports)');
    try {
      const podsResponse = await client.get('/pods');
      console.log('✅ Success!');
      console.log(`   Response:`, JSON.stringify(podsResponse.data, null, 2));
    } catch (err: any) {
      console.log(`   ℹ️  Pods endpoint: ${err.response?.status || err.message}\n`);
    }

    // Test 3: List webhooks
    console.log('Test 3: List webhooks');
    try {
      const webhooksResponse = await client.get('/webhooks');
      console.log('✅ Success!');
      console.log(`   Response:`, JSON.stringify(webhooksResponse.data, null, 2));
    } catch (err: any) {
      console.log(`   ℹ️  Webhooks endpoint: ${err.response?.status || err.message}\n`);
    }

    // Test 4: List domains
    console.log('Test 4: List domains');
    try {
      const domainsResponse = await client.get('/domains');
      console.log('✅ Success!');
      console.log(`   Response:`, JSON.stringify(domainsResponse.data, null, 2));
    } catch (err: any) {
      console.log(`   ℹ️  Domains endpoint: ${err.response?.status || err.message}\n`);
    }

    console.log('\n🎉 AgentMail API is working correctly!');
    console.log('✅ Your API key is valid and the connection is established.\n');
    console.log('Next steps:');
    console.log('1. Create an inbox using the AgentMail dashboard or API');
    console.log('2. Set up webhooks to receive email notifications');
    console.log('3. Start sending and receiving emails!\n');

  } catch (error: any) {
    console.error('❌ AgentMail API Test Failed\n');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response from server');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }

    process.exit(1);
  }
}

testAgentMailAPI();
