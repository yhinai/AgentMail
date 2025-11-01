// Main entry point for AutoBazaaar
import dotenv from 'dotenv';
import { AutoBazaaarOrchestrator } from './core/orchestrator';
import { IntegrationManager } from './integrations';
import config from './config';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting AutoBazaaar Orchestrator...\n');

  try {
    // Initialize integrations
    const integrations = new IntegrationManager();
    
    // Health check integrations
    const health = await integrations.checkHealth();
    console.log('Integration Health:', health);
    
    // Initialize orchestrator
    const orchestrator = new AutoBazaaarOrchestrator({
      redis: config.redis,
      browserUse: integrations.browserUse || null,
      perplexity: integrations.perplexity || null,
      agentMail: integrations.agentMail || null,
      openai: integrations.openai || null,
      hyperspell: integrations.hyperspell || null,
      composio: integrations.composio || null,
      targetCategories: config.orchestrator.targetCategories,
      targetPlatforms: config.orchestrator.targetPlatforms,
      maxBudget: config.orchestrator.maxBudget,
      minProfitMargin: config.orchestrator.minProfitMargin,
      scanInterval: config.orchestrator.scanInterval,
      priceUpdateInterval: config.orchestrator.priceUpdateInterval,
      negotiationCheckInterval: config.orchestrator.negotiationCheckInterval,
      listingOptimizeInterval: config.orchestrator.listingOptimizeInterval
    }, integrations);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Shutting down AutoBazaaar...');
      await orchestrator.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n⏹️  Shutting down AutoBazaaar...');
      await orchestrator.stop();
      process.exit(0);
    });

    console.log('✅ AutoBazaaar Orchestrator is running. Press Ctrl+C to stop.\n');
    
    // Keep process alive
    setInterval(() => {
      const state = orchestrator.getState();
      console.log('Orchestrator status:', state.status);
    }, 60000); // Log status every minute
    
  } catch (error) {
    console.error('❌ Failed to start AutoBazaaar:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AutoBazaaarOrchestrator };
