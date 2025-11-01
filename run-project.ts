/**
 * Run the complete AutoBazaaar project
 * Starts all services including orchestrator and server
 */

import dotenv from 'dotenv';
dotenv.config();

async function startProject() {
  console.log('\n🚀 Starting AutoBazaaar Project');
  console.log('=' .repeat(70));
  
  // Check bridge service
  const axios = require('axios');
  try {
    const health = await axios.get('http://localhost:8001/health', { timeout: 2000 });
    console.log('✅ Python Bridge Service: Running (port 8001)');
  } catch {
    console.log('⚠️  Python Bridge Service: Not running');
    console.log('   Start it with: cd python_bridge && python3 browser_service.py');
  }
  
  console.log('\n📦 Starting Services...\n');
  
  // Import and start orchestrator
  try {
    console.log('1️⃣  Starting Orchestrator...');
    const { AutoBazaaarOrchestrator } = await import('./src/core/orchestrator');
    const { IntegrationManager } = await import('./src/integrations');
    const config = await import('./src/config');
    
    const integrations = new IntegrationManager();
    const health = await integrations.checkHealth();
    console.log('   Integration Health:', JSON.stringify(health, null, 2));
    
    const orchestrator = new AutoBazaaarOrchestrator({
      redis: config.default.redis,
      targetCategories: config.default.orchestrator.targetCategories,
      targetPlatforms: config.default.orchestrator.targetPlatforms,
      maxBudget: config.default.orchestrator.maxBudget,
      minProfitMargin: config.default.orchestrator.minProfitMargin,
      scanInterval: config.default.orchestrator.scanInterval,
      priceUpdateInterval: config.default.orchestrator.priceUpdateInterval,
      negotiationCheckInterval: config.default.orchestrator.negotiationCheckInterval,
      listingOptimizeInterval: config.default.orchestrator.listingOptimizeInterval
    }, integrations);
    
    console.log('   ✅ Orchestrator initialized\n');
    
    // Start orchestrator (if it has a start method)
    if (typeof orchestrator.start === 'function') {
      await orchestrator.start();
      console.log('   ✅ Orchestrator started\n');
    }
    
    // Also start server if needed
    console.log('2️⃣  Starting API Server...');
    try {
      const server = await import('./src/server/index');
      console.log('   ✅ Server module loaded');
    } catch (error: any) {
      console.log('   ⚠️  Server start skipped:', error.message.split('\n')[0]);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ AutoBazaaar Project Started!');
    console.log('='.repeat(70));
    console.log('\n📊 Services:');
    console.log('   - Orchestrator: Running');
    console.log('   - Bridge Service: http://localhost:8001');
    console.log('   - API Server: Run "npm run server" in separate terminal');
    console.log('   - UI: Run "npm run dev" for Next.js UI');
    console.log('\n💡 Press Ctrl+C to stop\n');
    
    // Keep running
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Shutting down...');
      if (typeof orchestrator.stop === 'function') {
        await orchestrator.stop();
      }
      process.exit(0);
    });
    
    // Show status periodically
    setInterval(() => {
      try {
        const state = orchestrator.getState?.();
        if (state) {
          console.log(`\n📊 Status: ${state.status || 'running'}`);
        }
      } catch (e) {
        // Ignore errors
      }
    }, 30000); // Every 30 seconds
    
  } catch (error: any) {
    console.error('\n❌ Error starting project:', error.message);
    console.error('Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
    process.exit(1);
  }
}

startProject();

