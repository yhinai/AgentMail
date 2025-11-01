// ProfitPilotOrchestrator - Main workflow coordination
import { EmailAgent } from '../agents/emailAgent';
import { BrowserAgent } from '../agents/browserAgent';
import { MarketAgent } from '../agents/marketAgent';
import { ContextStore } from '../memory/contextStore';
import { DatabaseClient } from '../database/client';
import type { Product, EmailMessage, Transaction, LegacyTransaction, NegotiationState, Metrics } from '../types';

export class ProfitPilotOrchestrator {
  private emailAgent: EmailAgent;
  private browserAgent: BrowserAgent;
  private marketAgent: MarketAgent;
  private contextStore: ContextStore;
  private db: DatabaseClient;
  private isRunning: boolean = false;
  private marketMonitoringInterval?: NodeJS.Timeout;
  private metricsUpdateInterval?: NodeJS.Timeout;

  constructor() {
    this.contextStore = new ContextStore();
    this.db = new DatabaseClient();
    this.emailAgent = new EmailAgent(this.contextStore);
    this.browserAgent = new BrowserAgent();
    this.marketAgent = new MarketAgent();
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Orchestrator already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting ProfitPilot Orchestrator...');

    try {
      // Start all monitoring loops in parallel
      await Promise.all([
        this.emailAgent.startMonitoring(),
        this.startMarketMonitoring(),
        this.startMetricsUpdater(),
      ]);

      console.log('ProfitPilot Orchestrator started successfully');
    } catch (error) {
      console.error('Error starting orchestrator:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    this.emailAgent.stopMonitoring();
    
    if (this.marketMonitoringInterval) {
      clearInterval(this.marketMonitoringInterval);
    }
    
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }

    console.log('ProfitPilot Orchestrator stopped');
  }

  /**
   * Handle incoming email (called by EmailAgent)
   */
  async handleIncomingEmail(emailData: EmailMessage): Promise<void> {
    console.log(`Handling incoming email from ${emailData.from}`);

    try {
      // Analyze email to extract product info
      const analysis = await this.emailAgent.analyzeEmailPublic(emailData);
      
      if (!analysis.product) {
        console.log('No product identified in email, skipping');
        return;
      }

      // Get market data
      const marketData = await this.marketAgent.analyzeProduct(analysis.product);

      // Get buyer context
      const buyerContext = await this.contextStore.getBuyerProfile(emailData.from);

      // Get optimal strategy
      const strategy = await this.contextStore.getOptimalStrategy(
        emailData.from,
        analysis.product
      );

      // Generate and send response
      const response = await this.emailAgent.generateResponsePublic(
        emailData,
        analysis,
        strategy,
        marketData
      );
      
      await this.emailAgent.sendResponsePublic(emailData, response);

      // Create or update transaction record (using legacy format for now)
      await this.db.createTransaction({
        buyerEmail: emailData.from,
        product: analysis.product || 'Unknown',
        productId: '', // Would be retrieved from product lookup
        initialPrice: strategy.initialPrice,
        finalPrice: strategy.initialPrice,
        cost: 0, // Would be retrieved from product data
        profit: strategy.initialPrice,
        status: 'negotiating',
        negotiationRounds: 0,
        listingUrls: [],
      });

      // Update metrics
      await this.updateMetrics({ emailsProcessed: 1 });

    } catch (error) {
      console.error('Error handling incoming email:', error);
    }
  }

  /**
   * Create listing for a product
   */
  async createListing(product: Product): Promise<void> {
    console.log(`Creating listings for product: ${product.title}`);

    try {
      // Get market data to optimize pricing
      const marketData = await this.marketAgent.analyzeProduct(product.title);
      
      // Adjust target price based on market data (use averagePrice as optimal)
      const optimalPrice = marketData.averagePrice * 0.95; // 5% below average for competitiveness
      if (optimalPrice > product.targetPrice) {
        product.targetPrice = Math.round(optimalPrice);
        console.log(`Adjusted price to ${product.targetPrice} based on market analysis`);
      }

      // Create listings on multiple platforms
      const results = await this.browserAgent.createListings(product);

      console.log(`Listings created: ${results.success.length} successful, ${results.failed.length} failed`);
      console.log('Listing URLs:', results.urls);

      // Store product and listings in database
      await this.db.createProduct(product);

    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Handle negotiation round
   */
  async handleNegotiation(
    threadId: string,
    buyerEmail: string,
    product: string,
    buyerOffer: number
  ): Promise<void> {
    console.log(`Handling negotiation: ${product} - Offer: $${buyerOffer}`);

    try {
      // Get negotiation state
      let negotiation = await this.db.getNegotiationState(threadId);
      
      if (!negotiation) {
        // Create new negotiation state
        const strategy = await this.contextStore.getOptimalStrategy(buyerEmail, product);
        
        const negotiationData = await this.db.createNegotiationState({
          buyerEmail,
          product,
          threadId,
          currentPrice: strategy.initialPrice,
          initialPrice: strategy.initialPrice,
          minPrice: strategy.minAcceptable,
          rounds: 0,
          offers: [],
          status: 'negotiating',
          listingUrls: [],
        });
        negotiation = negotiationData;
      }

      // Add buyer's offer
      negotiation.offers.push({
        price: buyerOffer,
        from: 'buyer',
        timestamp: new Date(),
      });
      negotiation.rounds++;

      // Check if offer is acceptable
      if (buyerOffer >= negotiation.minPrice) {
        // Accept offer
        negotiation.status = 'accepted';
        negotiation.agreedPrice = buyerOffer;
        negotiation.currentPrice = buyerOffer;

        // Close the deal
        await this.closeDeal(negotiation);
      } else {
        // Counter offer
        const strategy = await this.contextStore.getOptimalStrategy(buyerEmail, product);
        const counterOffer = Math.max(
          negotiation.minPrice,
          buyerOffer + (negotiation.currentPrice - buyerOffer) * 0.1 // 10% movement
        );

        negotiation.offers.push({
          price: counterOffer,
          from: 'seller',
          timestamp: new Date(),
        });
        negotiation.currentPrice = counterOffer;

        // Check if max rounds reached
        if (negotiation.rounds >= strategy.negotiationRounds) {
          // Final offer or decline
          if (counterOffer > negotiation.minPrice * 0.9) {
            negotiation.status = 'accepted';
            negotiation.agreedPrice = counterOffer;
            await this.closeDeal(negotiation);
          } else {
            negotiation.status = 'rejected';
          }
        }

        // Update negotiation state
        await this.db.updateNegotiationState(threadId, negotiation);
      }

    } catch (error) {
      console.error('Error handling negotiation:', error);
    }
  }

  /**
   * Close a deal
   */
  async closeDeal(negotiation: NegotiationState): Promise<LegacyTransaction> {
    console.log(`Closing deal: ${negotiation.product} for $${negotiation.agreedPrice}`);

    try {
      // Mark listings as sold
      if (negotiation.listingUrls.length > 0) {
        await this.browserAgent.markAsSold(negotiation.listingUrls);
      }

      // Get product cost (would be from product data)
      const productCost = 0; // Placeholder

      // Create transaction
      const transaction = await this.db.createTransaction({
        buyerEmail: negotiation.buyerEmail,
        product: negotiation.product,
        productId: '', // Would be retrieved
        initialPrice: negotiation.initialPrice,
        finalPrice: negotiation.agreedPrice || negotiation.currentPrice,
        cost: productCost,
        profit: (negotiation.agreedPrice || negotiation.currentPrice) - productCost,
        status: 'completed',
        negotiationRounds: negotiation.rounds,
        listingUrls: negotiation.listingUrls,
        completedAt: new Date(),
      });

      // Send confirmation email
      await this.emailAgent.sendConfirmationPublic(
        negotiation.buyerEmail,
        negotiation.product,
        negotiation.agreedPrice || negotiation.currentPrice
      );

      // Update metrics
      const metrics = await this.db.getMetrics();
      await this.db.updateMetrics({
        dealsCompleted: metrics.dealsCompleted + 1,
        totalProfit: metrics.totalProfit + transaction.profit,
        totalRevenue: metrics.totalRevenue + transaction.finalPrice,
      });

      // Record interaction
      await this.contextStore.recordInteraction({
        buyer: negotiation.buyerEmail,
        intent: 'closing',
        product: negotiation.product,
        timestamp: new Date(),
        outcome: 'closed',
        finalPrice: transaction.finalPrice,
      });

      return transaction;
    } catch (error) {
      console.error('Error closing deal:', error);
      throw error;
    }
  }

  /**
   * Start market monitoring
   */
  private async startMarketMonitoring(): Promise<void> {
    // Monitor market conditions periodically
    // This would analyze active products and adjust prices
    console.log('Market monitoring started');
    
    this.marketMonitoringInterval = setInterval(async () => {
      try {
        // Get all active products
        const products = await this.db.getAllProducts();
        
        for (const product of products) {
          const marketData = await this.marketAgent.analyzeProduct(product.title);
          
          // Update product price if market conditions changed (use averagePrice as optimal)
          const optimalPrice = marketData.averagePrice * 0.95; // 5% below average for competitiveness
          if (optimalPrice > product.targetPrice * 1.1) {
            console.log(`Market opportunity: ${product.title} could be priced higher`);
            // Could trigger price update logic here
          }
        }
      } catch (error) {
        console.error('Error in market monitoring:', error);
      }
    }, 3600000); // Every hour
  }

  /**
   * Start metrics updater
   */
  private async startMetricsUpdater(): Promise<void> {
    // Update metrics periodically
    this.metricsUpdateInterval = setInterval(async () => {
      try {
        const metrics = await this.db.getMetrics();
        
        // Calculate conversion rate
        const transactions = await this.db.getTransactionsByBuyer(''); // Would get all
        const completed = transactions.filter(t => t.status === 'completed').length;
        const conversionRate = transactions.length > 0 
          ? completed / transactions.length 
          : 0;

        await this.db.updateMetrics({
          conversionRate,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error('Error updating metrics:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Create or update transaction (using LegacyTransaction format)
   */
  private async createOrUpdateTransaction(data: Omit<LegacyTransaction, 'id' | 'createdAt'>): Promise<LegacyTransaction> {
    // Check if transaction exists (would query by buyer + product)
    // For now, create new transaction
    return await this.db.createTransaction(data);
  }

  /**
   * Update metrics
   */
  private async updateMetrics(updates: Partial<Metrics>): Promise<void> {
    await this.db.updateMetrics(updates);
  }

  /**
   * Get current metrics
   */
  async getMetrics(): Promise<Metrics> {
    return await this.db.getMetrics();
  }
}
