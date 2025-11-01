import dotenv from 'dotenv';
import { ProfitPilotOrchestrator } from '../workflows/orchestrator';
import { EmailAgent } from '../agents/emailAgent';
import { BrowserAgent } from '../agents/browserAgent';
import { MarketAgent } from '../agents/marketAgent';
import { ContextStore } from '../memory/contextStore';
import { DatabaseClient } from '../database/client';
import { AgentMailClient } from '../agents/agentMailClient';
import { BrowserUseClient } from '../agents/browserUseClient';
import { HyperspellClient } from '../memory/hyperspellClient';
import OpenAI from 'openai';
import {
  DemoScenario,
  Product,
  EmailMessage,
  NegotiationState,
} from '../types';
import { demoProducts, demoEmails, demoScenarios } from './scenarios';
import { Logger } from '../utils/logger';
import { sleep } from '../utils/retry';

dotenv.config();

export class DemoRunner {
  private orchestrator: ProfitPilotOrchestrator;
  private db: DatabaseClient;
  private scenarioRunning: boolean = false;

  constructor() {
    // Initialize all components
    const agentMailClient = new AgentMailClient({
      apiKey: process.env.AGENTMAIL_API_KEY || 'demo_key',
    });
    
    const browserClient = new BrowserUseClient({
      apiKey: process.env.BROWSER_USE_API_KEY || 'demo_key',
    });
    
    const hyperspellClient = new HyperspellClient({
      apiKey: process.env.HYPERSPELL_API_KEY || 'demo_key',
    });
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'demo_key',
    });
    
    const marketAgent = new MarketAgent(
      process.env.PERPLEXITY_API_KEY || 'demo_key'
    );
    
    const contextStore = new ContextStore(hyperspellClient);
    const emailAgent = new EmailAgent(
      agentMailClient,
      openai,
      contextStore
    );
    const browserAgent = new BrowserAgent(browserClient);
    const db = new DatabaseClient();
    
    this.orchestrator = new ProfitPilotOrchestrator(
      emailAgent,
      browserAgent,
      marketAgent,
      contextStore,
      db
    );
    
    this.db = db;
  }

  async runScenario(scenarioId: string = 'full_demo'): Promise<void> {
    if (this.scenarioRunning) {
      Logger.warn('Demo scenario already running');
      return;
    }

    this.scenarioRunning = true;
    const scenario = demoScenarios.find((s) => s.id === scenarioId);

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    Logger.info(`Starting demo scenario: ${scenario.name}`);
    
    // Enable demo mode
    process.env.DEMO_MODE = 'true';

    try {
      // Clear database
      await this.db.clearAll();

      // Run each step
      for (const step of scenario.steps) {
        Logger.info(`Executing step: ${step.description}`);
        
        await this.executeStep(step);
        
        // Wait before next step
        if (step.delay > 0) {
          await sleep(step.delay);
        }
      }

      Logger.info(`Demo scenario completed: ${scenario.name}`);
      
      // Show final summary
      await this.showSummary();
    } catch (error) {
      Logger.error('Error running demo scenario', error);
      throw error;
    } finally {
      this.scenarioRunning = false;
    }
  }

  private async executeStep(step: any): Promise<void> {
    switch (step.action) {
      case 'load_inventory':
        await this.loadInventory(step.data.products);
        break;
      
      case 'market_analysis':
        await this.performMarketAnalysis();
        break;
      
      case 'create_listings':
        await this.createListings();
        break;
      
      case 'receive_email':
        await this.receiveEmail(step.data.email);
        break;
      
      case 'process_email':
        await this.processEmail(step.data.emailId);
        break;
      
      case 'receive_offer':
        await this.receiveOffer(step.data.email);
        break;
      
      case 'negotiate':
        await this.simulateNegotiation(step.data);
        break;
      
      case 'close_deal':
        await this.closeDeal();
        break;
      
      case 'show_metrics':
        await this.showMetrics();
        break;
      
      default:
        Logger.warn(`Unknown step action: ${step.action}`);
    }
  }

  private async loadInventory(products: Product[]): Promise<void> {
    Logger.info(`Loading ${products.length} products into inventory`);
    
    for (const product of products) {
      await this.db.createProduct(product);
    }
    
    Logger.info('Inventory loaded');
  }

  private async performMarketAnalysis(): Promise<void> {
    Logger.info('Performing market analysis...');
    
    const products = await this.db.getProducts();
    
    // Create market agent for analysis
    const { MarketAgent } = await import('../agents/marketAgent');
    const marketAgent = new MarketAgent(process.env.PERPLEXITY_API_KEY || 'demo_key');
    
    for (const product of products) {
      const marketData = await marketAgent.analyzeProduct(product.title);
      const optimalPrice = await marketAgent.calculateOptimalPrice(
        product,
        marketData
      );
      
      Logger.info(`${product.title}: Optimal price $${optimalPrice} (Market avg: $${marketData.average.toFixed(2)})`);
    }
  }

  private async createListings(): Promise<void> {
    Logger.info('Creating listings on multiple platforms...');
    
    const products = await this.db.getProducts();
    
    for (const product of products.slice(0, 2)) { // Create listings for first 2 products
      try {
        await this.orchestrator.createListing(product);
        Logger.info(`✓ Listings created for ${product.title}`);
      } catch (error) {
        Logger.error(`Error creating listings for ${product.title}`, error);
      }
    }
  }

  private async receiveEmail(email: EmailMessage): Promise<void> {
    Logger.info(`📧 Email received: ${email.subject}`);
    
    // Simulate email arrival
    await this.db.logActivity({
      type: 'email_received',
      description: `Email from ${email.from}: ${email.subject}`,
      timestamp: new Date(),
      metadata: {
        from: email.from,
        subject: email.subject,
      },
    });
    
    // Process email
    await this.orchestrator.handleIncomingEmail(email);
  }

  private async processEmail(emailId?: string): Promise<void> {
    Logger.info('Processing email with AI...');
    // Email processing is handled by handleIncomingEmail
    await sleep(2000); // Simulate processing time
  }

  private async receiveOffer(email: EmailMessage): Promise<void> {
    Logger.info(`📧 Counter-offer received: ${email.subject}`);
    await this.receiveEmail(email);
  }

  private async simulateNegotiation(data?: any): Promise<void> {
    Logger.info('🤝 Negotiating deal...');
    
    // Simulate negotiation rounds
    await sleep(1500);
    Logger.info('→ Round 1: Buyer offers $1400, Agent counters with $1500');
    await sleep(1000);
    Logger.info('→ Round 2: Buyer accepts $1500');
  }

  private async closeDeal(): Promise<void> {
    Logger.info('💰 Closing deal...');
    
    const negotiation: NegotiationState = {
      buyerEmail: demoEmails[0].from,
      product: demoProducts[0].title,
      initialPrice: 1600,
      agreedPrice: 1500,
      cost: demoProducts[0].cost,
      rounds: 2,
      tactics: ['urgency', 'value-add'],
      listingUrls: {
        craigslist: 'https://craigslist.org/view/12345',
        facebook: 'https://facebook.com/marketplace/item/67890',
      },
    };
    
    await this.orchestrator.closeDeal(negotiation);
    Logger.info('✓ Deal closed successfully!');
  }

  private async showMetrics(): Promise<void> {
    Logger.info('📊 Final Metrics:');
    
    const metrics = await this.db.getMetrics();
    const transactions = await this.db.getTransactions();
    
    console.log('\n=== ProfitPilot Metrics ===');
    console.log(`Total Profit: $${metrics.totalProfit.toFixed(2)}`);
    console.log(`Deals Completed: ${metrics.dealsCompleted}`);
    console.log(`Deals Pending: ${metrics.dealsPending}`);
    console.log(`Conversion Rate: ${(metrics.conversionRate * 100).toFixed(1)}%`);
    console.log(`Average Profit Margin: ${metrics.averageProfitMargin.toFixed(1)}%`);
    console.log(`Total Revenue: $${metrics.totalRevenue.toFixed(2)}`);
    console.log(`Emails Processed: ${metrics.emailsProcessed}`);
    console.log(`Active Listings: ${metrics.listingsActive}`);
    console.log('\n=== Recent Transactions ===');
    
    for (const txn of transactions.slice(0, 5)) {
      console.log(
        `${txn.product}: $${txn.finalPrice || txn.initialPrice} - ${txn.status}`
      );
    }
    
    console.log('\n');
  }

  private async showSummary(): Promise<void> {
    await this.showMetrics();
    
    const activityLogs = await this.db.getActivityLogs(10);
    
    console.log('=== Recent Activity ===');
    for (const log of activityLogs) {
      console.log(`[${log.timestamp.toLocaleTimeString()}] ${log.description}`);
    }
  }

  async runQuickDemo(): Promise<void> {
    await this.runScenario('quick_demo');
  }

  async runFullDemo(): Promise<void> {
    await this.runScenario('full_demo');
  }
}

// CLI entry point
if (require.main === module) {
  const runner = new DemoRunner();
  
  const scenarioId = process.argv[2] || 'full_demo';
  
  runner
    .runScenario(scenarioId)
    .then(() => {
      Logger.info('Demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      Logger.error('Demo failed', error);
      process.exit(1);
    });
}

