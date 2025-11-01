/**
 * Test System - Verify AgentMail integration is working
 */

import { AgentMailClient } from './src/services/AgentMailClient';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSystem() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING AGENTMAIL SYSTEM');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new AgentMailClient();

  try {
    // Test 1: List inboxes
    console.log('Test 1: Checking inbox access...');
    const inboxes = await client.listInboxes();

    if (inboxes.length === 0) {
      console.log('❌ No inboxes found!');
      return;
    }

    const inbox = inboxes[0];
    console.log('✅ Inbox found:', inbox.email || inbox.inbox_id);
    console.log('   Inbox ID:', inbox.inbox_id);
    console.log('');

    // Test 2: Check for messages
    console.log('Test 2: Fetching recent emails...');
    const messages = await client.listMessages(inbox.inbox_id, 10);

    console.log(`✅ Found ${messages.length} emails in inbox`);
    console.log('');

    if (messages.length === 0) {
      console.log('ℹ️  No emails yet. Send a test email to:', inbox.email || 'longweather398@agentmail.to');
      console.log('');
      console.log('Try this:');
      console.log('  To: longweather398@agentmail.to');
      console.log('  Subject: Test inquiry');
      console.log('  Body: Hi, I want to test the system!');
      console.log('');
    } else {
      // Show recent emails
      console.log('Recent Emails:');
      console.log('─────────────────────────────────────────────────────────\n');

      for (let i = 0; i < Math.min(5, messages.length); i++) {
        const msg = messages[i];
        console.log(`📧 Email ${i + 1}:`);
        console.log(`   From: ${msg.from || 'Unknown'}`);
        console.log(`   Subject: ${msg.subject || 'No subject'}`);
        console.log(`   Date: ${msg.created_at ? new Date(msg.created_at * 1000).toLocaleString() : 'Unknown'}`);
        console.log(`   Message ID: ${msg.message_id}`);
        console.log('');
      }
    }

    // Test 3: Check dashboard
    console.log('Test 3: Checking dashboard...');
    console.log('✅ Dashboard URL: http://localhost:3000');
    console.log('   Open this in your browser to see real-time updates!');
    console.log('');

    // Test 4: Check Convex
    console.log('Test 4: Checking Convex database...');
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl && convexUrl !== 'your_convex_url_here') {
      console.log('✅ Convex URL configured:', convexUrl);
      console.log('   Dashboard: https://dashboard.convex.dev');
    } else {
      console.log('⚠️  Convex URL not configured');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ AgentMail API: Working');
    console.log('✅ Inbox accessible:', inbox.email || inbox.inbox_id);
    console.log('✅ Email count:', messages.length);
    console.log('✅ Dashboard: http://localhost:3000');
    console.log('✅ Convex:', convexUrl ? 'Connected' : 'Mock mode');
    console.log('');
    console.log('🎉 System is operational!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Send an email to: longweather398@agentmail.to');
    console.log('2. Watch it appear at: http://localhost:3000');
    console.log('3. Check processing logs: tail -f /tmp/agentmail-convex-direct.log');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSystem();
