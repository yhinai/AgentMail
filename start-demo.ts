/**
 * Start Demo - Combined Email Service + UI
 * This initializes the email service and makes it available to the UI
 */

import { NewEmailOrchestrator } from './src/workflows/NewEmailOrchestrator';
import * as dotenv from 'dotenv';

dotenv.config();

async function startDemo() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 STARTING AGENTMAIL DEMO WITH UI');
  console.log('═══════════════════════════════════════════════════════════\n');

  const orchestrator = new NewEmailOrchestrator();

  try {
    // Initialize the orchestrator
    await orchestrator.start();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SYSTEM READY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    const inbox = orchestrator.getEmailService().getInbox();
    if (inbox) {
      const emailAddress = inbox.email || inbox.inbox_id;
      console.log(`📧 Your Inbox: ${emailAddress}`);
    }

    console.log(`\n📊 Dashboard: Start the UI with "npm run dev" in another terminal`);
    console.log(`   Then open: http://localhost:3000\n`);

    console.log('🔄 System is now running and processing emails...\n');
    console.log('Send emails to test the integration!\n');
    console.log('Press Ctrl+C to stop.\n');

    // Keep running
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down...');
      await orchestrator.stop();
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});

  } catch (error: any) {
    console.error('\n❌ Failed to start:', error.message);
    await orchestrator.stop();
    process.exit(1);
  }
}

startDemo();
