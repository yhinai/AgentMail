const axios = require('axios');

const API_KEY = 'bu_MAK5YW-RYeNfpeazZQOuVAOszoVbHV_-JO9Wo0L9A-M';
const BASE_URL = 'https://api.browser-use.com/api/v1';

async function testBrowserUseAPI() {
  console.log('🧪 Testing Browser-Use Cloud API\n');

  try {
    // Test 1: Create a simple task
    console.log('Test 1: Creating a simple task...');
    const task1 = await axios.post(
      `${BASE_URL}/run-task`,
      {
        task: 'Go to google.com and tell me the page title'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Task created:', task1.data);
    const taskId = task1.data.id;

    // Test 2: Check task status with different endpoints
    console.log('\nTest 2: Checking task status...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

    // Try different endpoint patterns
    const endpoints = [
      `/tasks/${taskId}`,
      `/task/${taskId}`,
      `/run-task/${taskId}`,
      `/task-status/${taskId}`,
      `/get-result/${taskId}`
    ];

    for (const endpoint of endpoints) {
      try {
        const status = await axios.get(
          `${BASE_URL}${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
          }
        );
        console.log(`✅ ${endpoint}:`, JSON.stringify(status.data, null, 2));
        break;
      } catch (err) {
        console.log(`ℹ️  ${endpoint}: ${err.response?.status || 'error'}`);
      }
    }

    // Test 3: Try listing all tasks
    console.log('\nTest 3: Listing tasks...');
    try {
      const allTasks = await axios.get(
        `${BASE_URL}/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );
      console.log('✅ All tasks:', JSON.stringify(allTasks.data, null, 2));
    } catch (err) {
      console.log('ℹ️  List tasks endpoint not available:', err.response?.status);
    }

    // Test 4: Create a more complex task
    console.log('\nTest 4: Creating Craigslist navigation task...');
    const task2 = await axios.post(
      `${BASE_URL}/run-task`,
      {
        task: 'Navigate to craigslist.org, find the "post" button, and tell me if it exists'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Complex task created:', task2.data);

    // Wait and check the result
    console.log('\nWaiting 5 seconds for task to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await axios.get(
      `${BASE_URL}/tasks/${task2.data.id}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    console.log('✅ Task result:', JSON.stringify(result.data, null, 2));

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testBrowserUseAPI();
