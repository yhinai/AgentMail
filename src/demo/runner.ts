// Demo runner for ProfitPilot
import { ProfitPilotOrchestrator } from '../workflows/orchestrator';
import { scenarios, demoProducts, demoEmails } from './scenarios';

export class DemoRunner {
  private orchestrator: ProfitPilotOrchestrator;
  private isRunning: boolean = false;

  constructor() {
    this.orchestrator = new ProfitPilotOrchestrator();
  }

  /**
   * Run the full demo
   */
  async runFullDemo(): Promise<void> {
    if (this.isRunning) {
      console.log('Demo already running');
      return;
    }

    this.isRunning = true;
    
    console.log('\n🚀 ProfitPilot Demo Starting...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Every minute, thousands of dollars die in email inboxes.');
    console.log('We built ProfitPilot - an AI agent that makes money while you sleep.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      // Execute each scenario sequentially
      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        console.log(`\n[${i + 1}/${scenarios.length}] ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        
        await scenario.execute(this.orchestrator);
        
        // Pause between scenarios for demo effect
        if (i < scenarios.length - 1) {
          await this.delay(2000);
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Demo Complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Show final summary
      await this.showSummary();
      
    } catch (error) {
      console.error('\n❌ Demo error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run a specific scenario
   */
  async runScenario(scenarioName: string): Promise<void> {
    const scenario = scenarios.find(s => s.name === scenarioName);
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioName}`);
    }

    console.log(`\nRunning scenario: ${scenario.name}`);
    await scenario.execute(this.orchestrator);
  }

  /**
   * Show demo summary
   */
  private async showSummary(): Promise<void> {
    const metrics = await this.orchestrator.getMetrics();
    
    console.log('\n📊 Final Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Deals Completed:     ${metrics.dealsCompleted}`);
    console.log(`   Total Profit:        $${metrics.totalProfit.toFixed(2)}`);
    console.log(`   Total Revenue:       $${metrics.totalRevenue.toFixed(2)}`);
    console.log(`   Conversion Rate:    ${(metrics.conversionRate * 100).toFixed(1)}%`);
    console.log(`   Emails Processed:    ${metrics.emailsProcessed}`);
    console.log(`   Response Time:       ${metrics.averageResponseTime}ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✨ Architecture:');
    console.log('   • AgentMail: Email automation');
    console.log('   • Hyperspell: Buyer memory');
    console.log('   • Browser-Use: Listing automation');
    console.log('   • Perplexity: Market intelligence');
    console.log('   • Convex: Real-time database\n');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const runner = new DemoRunner();
  
  const scenario = process.argv[2];
  if (scenario) {
    runner.runScenario(scenario).catch(console.error);
  } else {
    runner.runFullDemo().catch(console.error);
  }
}
