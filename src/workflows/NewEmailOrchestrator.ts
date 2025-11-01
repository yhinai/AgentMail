// @ts-nocheck - TODO: Update for merged AutoBazaaar types
/**
 * New Email Orchestrator
 * Integrates the new AgentMail-based email system with existing agents
 */

import { EmailService } from '../services/EmailService';
import { EmailProcessor } from '../services/EmailProcessor';
import { getEmailService } from '../services/EmailServiceSingleton';
import { BrowserAgent } from '../agents/browserAgent';
import { MarketAgent } from '../agents/marketAgent';
import { DatabaseClient } from '../database/client';
import type { Product, Transaction, Metrics } from '../types';

export class NewEmailOrchestrator {
  private emailService: EmailService;
  private emailProcessor: EmailProcessor;
  private browserAgent: BrowserAgent;
  private marketAgent: MarketAgent;
  private db: DatabaseClient;
  private isRunning: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    // Use singleton for email service
    this.emailService = getEmailService();
    this.emailProcessor = new EmailProcessor(this.emailService);

    // Existing agents
    this.browserAgent = new BrowserAgent();
    this.marketAgent = new MarketAgent();
    this.db = new DatabaseClient();

    console.log('📧 NewEmailOrchestrator created');
  }

  // ============================================
  // INITIALIZATION & LIFECYCLE
  // ============================================

  /**
   * Initialize and start the orchestrator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Orchestrator already running');
      return;
    }

    console.log('\n🚀 Starting NewEmailOrchestrator...\n');

    try {
      // Step 1: Initialize email service and create inbox
      console.log('📧 Initializing email service...');
      const inbox = await this.emailService.initialize('ProfitPilot Sales');
      console.log(`✅ Inbox ready: ${inbox.email}\n`);

      // Step 2: Setup webhooks (optional - needs public URL)
      const webhookUrl = process.env.WEBHOOK_URL;
      if (webhookUrl) {
        console.log('🔗 Setting up webhook...');
        await this.emailService.setupWebhook(webhookUrl);
        console.log(`✅ Webhook configured: ${webhookUrl}\n`);
      } else {
        console.log('ℹ️  No webhook URL configured, using polling mode\n');
        // Start polling for new emails
        const pollInterval = parseInt(process.env.EMAIL_POLL_INTERVAL || '30', 10) * 1000;
        this.emailService.startPolling(pollInterval);
      }

      // Step 3: Setup event listeners
      this.setupEventListeners();

      // Step 4: Start email queue processing
      console.log('🔄 Starting email queue processor...');
      this.startEmailProcessing();

      // Step 5: Mark as running
      this.isRunning = true;
      console.log('✅ NewEmailOrchestrator started successfully!\n');
      console.log(`📬 Ready to receive emails at: ${inbox.email}\n`);

    } catch (error: any) {
      console.error('❌ Failed to start orchestrator:', error.message);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    console.log('\n🛑 Stopping NewEmailOrchestrator...');

    this.isRunning = false;

    // Stop processing
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    // Shutdown email service
    await this.emailService.shutdown();

    console.log('✅ NewEmailOrchestrator stopped\n');
  }

  // ============================================
  // EVENT HANDLING
  // ============================================

  /**
   * Setup event listeners for email service
   */
  private setupEventListeners(): void {
    // Email queued
    this.emailService.on('email:queued', (email) => {
      console.log(`📬 Email queued: ${email.subject}`);
    });

    // Email processing triggered
    this.emailService.on('email:process', async (email) => {
      console.log(`🔄 Processing email: ${email.id}`);
      await this.emailProcessor.processEmail(email);
    });

    // Email sent
    this.emailService.on('email:sent', (message) => {
      console.log(`📤 Email sent: ${message.message_id}`);
    });

    // Status updates
    this.emailService.on('email:status', ({ emailId, status, error }) => {
      if (status === 'failed') {
        console.error(`❌ Email ${emailId} failed: ${error}`);
      } else if (status === 'completed') {
        console.log(`✅ Email ${emailId} completed`);
      }
    });

    // Activity logged
    this.emailService.on('activity:logged', (activity) => {
      // Can be used to update UI or database
    });

    console.log('✅ Event listeners configured\n');
  }

  // ============================================
  // EMAIL PROCESSING
  // ============================================

  /**
   * Start background email processing
   */
  private startEmailProcessing(): void {
    const intervalMs = parseInt(process.env.EMAIL_POLL_INTERVAL || '10', 10) * 1000;

    this.processingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.emailProcessor.processPendingEmails(5);
      } catch (error: any) {
        console.error('❌ Email processing error:', error.message);
      }
    }, intervalMs);

    console.log(`✅ Email processor started (interval: ${intervalMs / 1000}s)\n`);
  }

  // ============================================
  // PRODUCT LISTING
  // ============================================

  /**
   * Create product listing across platforms
   */
  async createListing(product: Product): Promise<string[]> {
    console.log(`\n📝 Creating listing for: ${product.title}`);

    try {
      // Step 1: Get market analysis
      console.log('📊 Analyzing market...');
      const marketData = await this.marketAgent.analyzeProduct(product.title);

      // Adjust pricing based on market data
      const adjustedPrice = Math.max(
        product.targetPrice,
        Math.round(marketData.optimal * 0.95) // Slightly below optimal to attract buyers
      );

      console.log(`✅ Market analysis complete. Suggested price: $${adjustedPrice}`);

      // Step 2: Create listings on platforms
      console.log('🌐 Creating listings on platforms...');
      const platforms = ['craigslist', 'facebook', 'ebay'];
      const listingUrls: string[] = [];

      for (const platform of platforms) {
        try {
          const url = await this.browserAgent.createListing(platform, {
            title: product.title,
            description: product.description,
            price: adjustedPrice,
            images: product.images || [],
            category: product.category,
            condition: product.condition,
          });

          listingUrls.push(url);
          console.log(`   ✅ ${platform}: ${url}`);
        } catch (error: any) {
          console.error(`   ❌ ${platform} failed: ${error.message}`);
        }
      }

      // Step 3: Store in database
      await this.db.createProduct({
        ...product,
        targetPrice: adjustedPrice,
      });

      console.log(`✅ Listing created with ${listingUrls.length} URLs\n`);
      return listingUrls;

    } catch (error: any) {
      console.error(`❌ Failed to create listing: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // NEGOTIATION HANDLING
  // ============================================

  /**
   * Handle negotiation workflow
   */
  async handleNegotiation(
    threadId: string,
    buyerEmail: string,
    product: string,
    offerPrice: number
  ): Promise<void> {
    console.log(`\n💰 Handling negotiation: ${buyerEmail} offers $${offerPrice} for ${product}`);

    try {
      // Get or create negotiation state
      let negotiation = await this.db.getNegotiationByThread(threadId);

      if (!negotiation) {
        // Create new negotiation
        const productData = await this.db.getProductByName(product);
        const minPrice = productData ? productData.cost * 1.2 : offerPrice * 0.8;

        negotiation = await this.db.createNegotiation({
          buyerEmail,
          product,
          threadId,
          currentPrice: offerPrice,
          initialPrice: offerPrice,
          minPrice,
          rounds: 1,
          offers: [{
            price: offerPrice,
            from: 'buyer',
            timestamp: Date.now(),
          }],
          status: 'negotiating',
          listingUrls: [],
        });
      } else {
        // Update existing negotiation
        negotiation = await this.db.updateNegotiation(negotiation._id, {
          currentPrice: offerPrice,
          rounds: negotiation.rounds + 1,
          offers: [
            ...negotiation.offers,
            {
              price: offerPrice,
              from: 'buyer',
              timestamp: Date.now(),
            },
          ],
        });
      }

      // Evaluate offer
      if (offerPrice >= negotiation.initialPrice * 0.95) {
        // Accept offer
        console.log(`✅ Accepting offer of $${offerPrice}`);
        await this.acceptOffer(negotiation, offerPrice);
      } else if (offerPrice >= negotiation.minPrice) {
        // Counter offer
        const counterPrice = Math.round((offerPrice + negotiation.initialPrice) / 2);
        console.log(`🔄 Countering with $${counterPrice}`);
        // Response will be generated by EmailProcessor
      } else {
        // Decline
        console.log(`❌ Offer too low (min: $${negotiation.minPrice})`);
        // Response will be generated by EmailProcessor
      }

    } catch (error: any) {
      console.error(`❌ Negotiation handling failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Accept offer and close deal
   */
  private async acceptOffer(negotiation: any, finalPrice: number): Promise<void> {
    console.log(`\n🎉 Closing deal: ${negotiation.product} for $${finalPrice}`);

    try {
      // Step 1: Update negotiation
      await this.db.updateNegotiation(negotiation._id, {
        status: 'accepted',
        agreedPrice: finalPrice,
      });

      // Step 2: Mark listings as sold
      for (const url of negotiation.listingUrls) {
        try {
          const platform = this.getPlatformFromUrl(url);
          await this.browserAgent.markAsSold(platform, url);
        } catch (error) {
          console.warn(`⚠️  Could not mark ${url} as sold`);
        }
      }

      // Step 3: Create transaction
      const productData = await this.db.getProductByName(negotiation.product);
      const cost = productData?.cost || finalPrice * 0.7;
      const profit = finalPrice - cost;

      await this.db.createTransaction({
        buyerEmail: negotiation.buyerEmail,
        product: negotiation.product,
        productId: productData?._id || 'unknown',
        initialPrice: negotiation.initialPrice,
        finalPrice,
        cost,
        profit,
        status: 'completed',
        negotiationRounds: negotiation.rounds,
        listingUrls: negotiation.listingUrls,
        completedAt: Date.now(),
      });

      // Step 4: Update metrics
      await this.updateMetrics();

      console.log(`✅ Deal closed successfully! Profit: $${profit}\n`);

    } catch (error: any) {
      console.error(`❌ Failed to close deal: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // METRICS & REPORTING
  // ============================================

  /**
   * Update system metrics
   */
  private async updateMetrics(): Promise<void> {
    try {
      const transactions = await this.db.getAllTransactions();
      const completed = transactions.filter(t => t.status === 'completed');

      const queueStats = await this.emailService.getQueueStats();

      const metrics: Metrics = {
        dealsCompleted: completed.length,
        totalProfit: completed.reduce((sum, t) => sum + t.profit, 0),
        totalRevenue: completed.reduce((sum, t) => sum + t.finalPrice, 0),
        conversionRate: transactions.length > 0 ? completed.length / transactions.length : 0,
        averageResponseTime: 30, // In real system, calculate from timestamps
        averageNegotiationRounds: completed.length > 0
          ? completed.reduce((sum, t) => sum + t.negotiationRounds, 0) / completed.length
          : 0,
        activeListings: 0, // In real system, count active listings
        emailsProcessed: queueStats.total,
        lastUpdated: Date.now(),
      };

      await this.db.updateMetrics(metrics);
    } catch (error) {
      console.warn('⚠️  Could not update metrics');
    }
  }

  /**
   * Get current metrics
   */
  async getMetrics(): Promise<Metrics> {
    return await this.db.getMetrics();
  }

  // ============================================
  // UTILITY
  // ============================================

  private getPlatformFromUrl(url: string): string {
    if (url.includes('craigslist')) return 'craigslist';
    if (url.includes('facebook')) return 'facebook';
    if (url.includes('ebay')) return 'ebay';
    return 'unknown';
  }

  getEmailService(): EmailService {
    return this.emailService;
  }

  getEmailProcessor(): EmailProcessor {
    return this.emailProcessor;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get activity feed for UI
   */
  getRecentActivity(limit: number = 50) {
    return this.emailService.getRecentActivity(limit);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return await this.emailService.getQueueStats();
  }
}
