// Main entry point for ProfitPilot
import dotenv from 'dotenv';
import { ProfitPilotOrchestrator } from './workflows/orchestrator';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting ProfitPilot...\n');

  const orchestrator = new ProfitPilotOrchestrator();

  try {
    // Start the orchestrator
    await orchestrator.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Shutting down ProfitPilot...');
      await orchestrator.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n⏹️  Shutting down ProfitPilot...');
      await orchestrator.stop();
      process.exit(0);
    });

    console.log('✅ ProfitPilot is running. Press Ctrl+C to stop.\n');
  } catch (error) {
    console.error('❌ Failed to start ProfitPilot:', error);
    process.exit(1);
  }
}

main();
