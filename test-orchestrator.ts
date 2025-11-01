// Quick test script to run orchestrator for health check
import dotenv from 'dotenv';
import { AutoBazaaarOrchestrator } from './src/core/orchestrator';
import { IntegrationManager } from './src/integrations';
import config from './src/config';

// Load environment variables
dotenv.config();

async function testOrchestrator() {
  console.log('🚀 Testing AutoBazaaar Orchestrator...\n');

  try {
    // Initialize integrations
    console.log('📦 Initializing integrations...');
    const integrations = new IntegrationManager();
    
    // Health check integrations
    console.log('🏥 Running health checks...');
    const health = await integrations.checkHealth();
    console.log('\nIntegration Health Results:');
    console.log(JSON.stringify(health, null, 2));
    
    console.log('\n📊 Integration Status:');
    console.log(`AgentMail: ${integrations.agentMail ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`Browser-Use: ${integrations.browserUse ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`Hyperspell: ${integrations.hyperspell ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`Perplexity: ${integrations.perplexity ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`Composio: ${integrations.composio ? '✅ Initialized' : '❌ Not initialized'}`);
    console.log(`OpenAI: ${integrations.openai ? '✅ Initialized' : '❌ Not initialized'}`);
    
    // Initialize orchestrator
    console.log('\n🎼 Initializing orchestrator...');
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

    // Get initial state
    const state = orchestrator.getState();
    console.log('\n📈 Orchestrator State:');
    console.log(JSON.stringify(state, null, 2));
    
    console.log('\n✅ Orchestrator initialized successfully!');
    
    // Clean shutdown
    console.log('\n🛑 Shutting down...');
    await orchestrator.stop();
    console.log('✅ Shutdown complete');
    
  } catch (error: any) {
    console.error('\n❌ Error testing orchestrator:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testOrchestrator();

