import { EmailAgent } from '../agents/emailAgent';
import { BrowserAgent } from '../agents/browserAgent';
import { MarketAgent } from '../agents/marketAgent';
import { ContextStore } from '../memory/contextStore';
import { DatabaseClient } from '../database/client';
import {
  Product,
  Transaction,
  EmailMessage,
  Metrics,
  ActivityLog,
  NegotiationState,
} from '../types';
import { Logger } from '../utils/logger';
import { retry } from '../utils/retry';

export class ProfitPilotOrchestrator {
  private emailAgent: EmailAgent;
  private browserAgent: BrowserAgent;
  private marketAgent: MarketAgent;
  private contextStore: ContextStore;
  private db: DatabaseClient;
  private isRunning: boolean = false;
  private marketMonitoringInterval?: NodeJS.Timeout;
  private metricsUpdateInterval?: NodeJS.Timeout;

  constructor(
    emailAgent: EmailAgent,
    browserAgent: BrowserAgent,
    marketAgent: MarketAgent,
    contextStore: ContextStore,
    db: DatabaseClient
  ) {
    this.emailAgent = emailAgent;
    this.browserAgent = browserAgent;
    this.marketAgent = marketAgent;
    this.contextStore = contextStore;
    this.db = db;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      Logger.warn('Orchestrator already running');
      return;
    }

    this.isRunning = true;
    Logger.info('Starting ProfitPilot Orchestrator...');

    try {
      // Start all monitoring processes
      await Promise.all([
        this.emailAgent.startMonitoring(30000), // Check emails every 30s
        this.startMarketMonitoring(3600000), // Market analysis every hour
        this.startMetricsUpdater(10000), // Update metrics every 10s
      ]);

      Logger.info('ProfitPilot Orchestrator started successfully');
      await this.db.logActivity({
        type: 'deal_closed', // Reuse for system start
        description: 'ProfitPilot orchestrator started',
        timestamp: new Date(),
      });
    } catch (error) {
      Logger.error('Error starting orchestrator', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    Logger.info('Stopping ProfitPilot Orchestrator...');

    this.emailAgent.stopMonitoring();

    if (this.marketMonitoringInterval) {
      clearInterval(this.marketMonitoringInterval);
    }

    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }

    Logger.info('ProfitPilot Orchestrator stopped');
  }

  async handleIncomingEmail(emailData: EmailMessage): Promise<void> {
    Logger.info(`Handling incoming email from ${emailData.from}`);

    await this.db.logActivity({
      type: 'email_received',
      description: `Email received from ${emailData.from}: ${emailData.subject}`,
      timestamp: new Date(),
      metadata: {
        from: emailData.from,
        subject: emailData.subject,
      },
    });

    try {
      // Analyze email
      const analysis = await this.emailAgent['analyzeEmail'](emailData);

      if (!analysis.product) {
        Logger.warn('No product identified in email, skipping');
        return;
      }

      // Get market data
      const marketData = await this.marketAgent.analyzeProduct(analysis.product);

      // Get buyer context
      const buyerProfile = await this.contextStore.getBuyerProfile(emailData.from);

      // Get optimal strategy
      const strategy = await this.contextStore.getOptimalStrategy(
        analysis.product,
        emailData.from
      );

      // Adjust strategy based on market data
      if (marketData.optimal > strategy.pricePoint) {
        strategy.pricePoint = marketData.optimal;
      }

      // Process email through email agent
      await this.emailAgent.processMessage(emailData);

      // Create or update transaction
      const existingTransaction = await this.db.getTransactions({
        buyerEmail: emailData.from,
        status: 'negotiating',
      });

      if (existingTransaction.length === 0) {
        await this.db.createTransaction({
          buyerEmail: emailData.from,
          product: analysis.product,
          status: 'negotiating',
          initialPrice: strategy.pricePoint,
          cost: 0, // Would come from product data
          negotiationRounds: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await this.db.logActivity({
        type: 'negotiation_started',
        description: `Negotiation started with ${emailData.from} for ${analysis.product}`,
        timestamp: new Date(),
        metadata: {
          buyer: emailData.from,
          product: analysis.product,
          initialPrice: strategy.pricePoint,
        },
      });
    } catch (error) {
      Logger.error('Error handling incoming email', error);
      await this.db.logActivity({
        type: 'error',
        description: `Error processing email from ${emailData.from}`,
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  async createListing(product: Product): Promise<void> {
    Logger.info(`Creating listings for product: ${product.title}`);

    try {
      // Analyze market first
      const marketData = await this.marketAgent.analyzeProduct(product.title);
      const optimalPrice = await this.marketAgent.calculateOptimalPrice(
        product,
        marketData
      );

      // Update product price based on market analysis
      product.price = optimalPrice;

      // Create listings on all platforms
      const results = await this.browserAgent.createListings(product);

      // Log activity
      await this.db.logActivity({
        type: 'listing_created',
        description: `Created listings for ${product.title} on ${results.success.join(', ')}`,
        timestamp: new Date(),
        metadata: {
          product: product.title,
          platforms: results.success,
          urls: results.urls,
        },
      });

      // Store product in database
      await this.db.createProduct(product);

      Logger.info(
        `Listings created: ${results.success.length} successful, ${results.failed.length} failed`
      );
    } catch (error) {
      Logger.error('Error creating listings', error);
      throw error;
    }
  }

  async closeDeal(negotiation: NegotiationState): Promise<Transaction> {
    Logger.info(`Closing deal with ${negotiation.buyerEmail}`);

    try {
      // Send confirmation email
      await this.emailAgent.sendConfirmation(
        negotiation.buyerEmail,
        negotiation.product,
        negotiation.agreedPrice
      );

      // Update listing status
      if (negotiation.listingUrls) {
        await this.browserAgent.markAsSold(negotiation.listingUrls);
      }

      // Record negotiation in context store
      await this.contextStore.recordNegotiation(
        negotiation.buyerEmail,
        negotiation.product,
        negotiation.initialPrice,
        negotiation.agreedPrice,
        negotiation.rounds,
        negotiation.tactics || [],
        'closed'
      );

      // Update transaction
      const transactions = await this.db.getTransactions({
        buyerEmail: negotiation.buyerEmail,
      });
      const transaction = transactions[0];

      if (transaction) {
        const profit = negotiation.agreedPrice - negotiation.cost;
        await this.db.updateTransaction(transaction.id, {
          status: 'completed',
          finalPrice: negotiation.agreedPrice,
          profit,
          negotiationRounds: negotiation.rounds,
          completedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Log activity
      await this.db.logActivity({
        type: 'deal_closed',
        description: `Deal closed: ${negotiation.product} sold to ${negotiation.buyerEmail} for $${negotiation.agreedPrice}`,
        timestamp: new Date(),
        metadata: {
          buyer: negotiation.buyerEmail,
          product: negotiation.product,
          finalPrice: negotiation.agreedPrice,
          profit: negotiation.agreedPrice - negotiation.cost,
        },
      });

      Logger.info(
        `Deal closed: $${negotiation.agreedPrice} profit: $${negotiation.agreedPrice - negotiation.cost}`
      );

      return transaction;
    } catch (error) {
      Logger.error('Error closing deal', error);
      throw error;
    }
  }

  private async startMarketMonitoring(intervalMs: number): Promise<void> {
    Logger.info(`Starting market monitoring (every ${intervalMs}ms)`);

    // Initial analysis
    await this.performMarketAnalysis();

    // Set up interval
    this.marketMonitoringInterval = setInterval(async () => {
      await this.performMarketAnalysis();
    }, intervalMs);
  }

  private async performMarketAnalysis(): Promise<void> {
    try {
      const products = await this.db.getProducts();

      for (const product of products) {
        try {
          const marketData = await this.marketAgent.analyzeProduct(product.title);
          const optimalPrice = await this.marketAgent.calculateOptimalPrice(
            product,
            marketData
          );

          // Update price if significantly different
          if (Math.abs(product.price - optimalPrice) > product.price * 0.1) {
            Logger.info(
              `Price update suggested for ${product.title}: $${product.price} -> $${optimalPrice}`
            );

            // Update listings (would update in real implementation)
            // await this.browserAgent.updatePrice(...)
          }
        } catch (error) {
          Logger.error(`Error analyzing market for ${product.title}`, error);
        }
      }
    } catch (error) {
      Logger.error('Error in market monitoring', error);
    }
  }

  private async startMetricsUpdater(intervalMs: number): Promise<void> {
    Logger.info(`Starting metrics updater (every ${intervalMs}ms)`);

    // Initial update
    await this.updateMetrics();

    // Set up interval
    this.metricsUpdateInterval = setInterval(async () => {
      await this.updateMetrics();
    }, intervalMs);
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Metrics are automatically calculated by database client
      const metrics = await this.db.getMetrics();
      
      Logger.debug('Metrics updated', {
        profit: metrics.totalProfit,
        deals: metrics.dealsCompleted,
        conversion: metrics.conversionRate,
      });
    } catch (error) {
      Logger.error('Error updating metrics', error);
    }
  }

  async getStatus(): Promise<{
    running: boolean;
    metrics: Metrics;
    recentActivity: ActivityLog[];
  }> {
    const metrics = await this.db.getMetrics();
    const recentActivity = await this.db.getActivityLogs(10);

    return {
      running: this.isRunning,
      metrics,
      recentActivity,
    };
  }
}

