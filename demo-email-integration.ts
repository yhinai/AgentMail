/**
 * AgentMail Integration Demo
 * Tests the complete email processing pipeline
 */

import { NewEmailOrchestrator } from './src/workflows/NewEmailOrchestrator';
import * as dotenv from 'dotenv';

dotenv.config();

async function runDemo() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 AGENTMAIL INTEGRATION DEMO');
  console.log('═══════════════════════════════════════════════════════════\n');

  const orchestrator = new NewEmailOrchestrator();

  try {
    // ============================================
    // STEP 1: Initialize System
    // ============================================
    console.log('STEP 1: Initializing Email System\n');
    console.log('───────────────────────────────────────────────────────────\n');

    await orchestrator.start();

    const inbox = orchestrator.getEmailService().getInbox();
    if (!inbox) {
      throw new Error('Inbox not initialized');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // STEP 2: Display Current Status
    // ============================================
    console.log('STEP 2: Current System Status\n');
    console.log('───────────────────────────────────────────────────────────\n');

    console.log(`📧 Inbox Email: ${inbox.email}`);
    console.log(`📊 Pod ID: ${inbox.pod_id}`);
    console.log(`🆔 Inbox ID: ${inbox.inbox_id}\n`);

    const stats = orchestrator.getQueueStats();
    console.log('Queue Statistics:');
    console.log(`  Total Emails: ${stats.total}`);
    console.log(`  Pending: ${stats.pending}`);
    console.log(`  Processing: ${stats.processing}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Failed: ${stats.failed}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // STEP 3: Simulate Incoming Emails
    // ============================================
    console.log('STEP 3: Simulating Incoming Emails\n');
    console.log('───────────────────────────────────────────────────────────\n');

    const emailService = orchestrator.getEmailService();

    // Simulate 3 different types of emails
    const testEmails = [
      {
        messageId: `test_${Date.now()}_1`,
        threadId: `thread_${Date.now()}_1`,
        from: 'buyer1@example.com',
        to: inbox.email,
        subject: 'Interested in your iPhone 13',
        body: 'Hi! I saw your listing for the iPhone 13. Is it still available? What\'s the best price you can offer?',
        receivedAt: new Date(),
        priority: 'medium' as const,
      },
      {
        messageId: `test_${Date.now()}_2`,
        threadId: `thread_${Date.now()}_2`,
        from: 'buyer2@example.com',
        to: inbox.email,
        subject: 'Offer for MacBook Pro',
        body: 'Hello, I\'d like to offer $800 for the MacBook Pro. Let me know if you\'re interested. Thanks!',
        receivedAt: new Date(),
        priority: 'high' as const,
      },
      {
        messageId: `test_${Date.now()}_3`,
        threadId: `thread_${Date.now()}_3`,
        from: 'buyer3@example.com',
        to: inbox.email,
        subject: 'Quick question about the headphones',
        body: 'Are the Sony headphones brand new or used? Do they come with original packaging?',
        receivedAt: new Date(),
        priority: 'low' as const,
      },
    ];

    console.log(`🧪 Simulating ${testEmails.length} incoming emails...\n`);

    for (const email of testEmails) {
      const emailId = emailService.queueEmail(email);
      console.log(`✅ Queued: ${email.subject}`);
      console.log(`   From: ${email.from}`);
      console.log(`   ID: ${emailId}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // STEP 4: Process Emails
    // ============================================
    console.log('STEP 4: Processing Emails with AI\n');
    console.log('───────────────────────────────────────────────────────────\n');

    const emailProcessor = orchestrator.getEmailProcessor();
    console.log('🤖 Starting AI-powered email processing...\n');

    const results = await emailProcessor.processPendingEmails(10);

    console.log(`\n📊 Processing Results:\n`);
    for (const result of results) {
      console.log(`Email ID: ${result.emailId}`);
      console.log(`  Intent: ${result.analysis.intent}`);
      console.log(`  Sentiment: ${result.analysis.sentiment}`);
      console.log(`  Urgency: ${result.analysis.urgency}`);
      console.log(`  Confidence: ${result.analysis.confidence}`);
      console.log(`  Strategy: ${result.response.strategy}`);
      console.log(`  Should Send: ${result.response.shouldSend}`);
      console.log(`  Sent: ${result.sent ? '✅ Yes' : '⏸️  No (manual review)' }`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // STEP 5: Display Activity Log
    // ============================================
    console.log('STEP 5: Recent Activity Log\n');
    console.log('───────────────────────────────────────────────────────────\n');

    const activities = orchestrator.getRecentActivity(10);
    console.log(`Found ${activities.length} activities:\n`);

    for (const activity of activities) {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      console.log(`[${time}] ${activity.type.toUpperCase()}`);
      console.log(`  Subject: ${activity.subject}`);
      console.log(`  From: ${activity.from}`);
      console.log(`  Summary: ${activity.summary}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // STEP 6: Final Statistics
    // ============================================
    console.log('STEP 6: Final Statistics\n');
    console.log('───────────────────────────────────────────────────────────\n');

    const finalStats = orchestrator.getQueueStats();
    console.log('Queue Statistics:');
    console.log(`  ✅ Completed: ${finalStats.completed}`);
    console.log(`  ⏸️  Pending: ${finalStats.pending}`);
    console.log(`  🔄 Processing: ${finalStats.processing}`);
    console.log(`  ❌ Failed: ${finalStats.failed}`);
    console.log(`  📊 Total: ${finalStats.total}\n`);

    console.log('═══════════════════════════════════════════════════════════\n');

    // ============================================
    // STEP 7: Keep Running or Exit
    // ============================================
    console.log('STEP 7: Next Steps\n');
    console.log('───────────────────────────────────────────────────────────\n');

    console.log('✅ Demo completed successfully!\n');
    console.log('The orchestrator is now running and listening for emails.\n');
    console.log('Options:');
    console.log('  1. Send a real email to: ' + inbox.email);
    console.log('  2. Set up webhooks for real-time processing');
    console.log('  3. Start the UI dashboard: npm run dev\n');

    console.log('Press Ctrl+C to stop the orchestrator.\n');

    // Keep running to receive real emails
    console.log('🔄 Monitoring for incoming emails...\n');

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      await orchestrator.stop();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    console.error('\nStack trace:', error.stack);

    await orchestrator.stop();
    process.exit(1);
  }
}

// Run the demo
runDemo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
