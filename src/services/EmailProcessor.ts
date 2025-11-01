// @ts-nocheck - TODO: Update MarketData type after merge
/**
 * Email Processor
 * Orchestrates email analysis, market intelligence, buyer profiling, and response generation
 */

import { EmailService, EmailQueueItem } from './EmailService';
import { ResponseGenerator, EmailAnalysis, ResponseContext, GeneratedResponse } from './ResponseGenerator';
import { MarketAgent } from '../agents/marketAgent';
import { ContextStore } from '../memory/contextStore';
import type { MarketData, BuyerProfile } from '../types';

export interface ProcessedEmail {
  emailId: string;
  analysis: EmailAnalysis;
  context: ResponseContext;
  response: GeneratedResponse;
  sent: boolean;
  error?: string;
}

export class EmailProcessor {
  private emailService: EmailService;
  private responseGenerator: ResponseGenerator;
  private marketAgent: MarketAgent;
  private contextStore: ContextStore;
  private autoRespond: boolean;

  constructor(emailService: EmailService) {
    this.emailService = emailService;
    this.responseGenerator = new ResponseGenerator();
    this.marketAgent = new MarketAgent();
    this.contextStore = new ContextStore();
    this.autoRespond = process.env.AUTO_RESPOND !== 'false';

    console.log(`📧 EmailProcessor initialized (auto-respond: ${this.autoRespond})`);
  }

  // ============================================
  // MAIN PROCESSING PIPELINE
  // ============================================

  /**
   * Process a single email through the complete pipeline
   */
  async processEmail(email: EmailQueueItem): Promise<ProcessedEmail> {
    console.log(`\n🔄 Processing email: ${email.subject}`);
    console.log(`   From: ${email.from}`);
    console.log(`   Priority: ${email.priority}`);

    try {
      // Mark as processing
      await this.emailService.updateEmailStatus(email.id, 'processing');

      // Step 1: Analyze email with AI
      const analysis = await this.analyzeEmail(email);
      console.log(`   ✅ Analysis: ${analysis.intent} (confidence: ${analysis.confidence})`);

      // Update metadata
      await this.emailService.updateEmailStatus(email.id, 'processing', undefined, {
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
      });

      // Step 2: Build context from product, buyer, and market data
      const context = await this.buildContext(email, analysis);
      console.log(`   ✅ Context built: ${context.product} @ $${context.currentPrice}`);

      // Step 3: Generate response
      const response = await this.generateResponse(analysis, context, email);
      console.log(`   ✅ Response generated: ${response.strategy}`);

      // Step 4: Send response (if auto-respond enabled and shouldSend is true)
      let sent = false;
      if (this.autoRespond && response.shouldSend) {
        sent = await this.sendResponse(email, response);
      } else {
        console.log(`   ⏸️  Response requires manual approval`);
      }

      // Step 5: Record interaction for learning
      await this.recordInteraction(email, analysis, response);

      // Mark as completed
      await this.emailService.updateEmailStatus(email.id, 'completed');

      return {
        emailId: email.id,
        analysis,
        context,
        response,
        sent,
      };

    } catch (error: any) {
      console.error(`   ❌ Processing failed:`, error.message);

      // Mark as failed with retry
      await this.emailService.updateEmailStatus(email.id, 'failed', error.message);

      // Retry if under limit
      if (email.retryCount < 3) {
        console.log(`   🔄 Scheduling retry...`);
        setTimeout(() => {
          this.emailService.retryEmail(email.id);
        }, 60000); // Retry after 1 minute
      }

      return {
        emailId: email.id,
        analysis: {
          intent: 'other',
          urgency: 'medium',
          sentiment: 'neutral',
          confidence: 0,
          keyPoints: [],
        },
        context: this.getDefaultContext(email.from),
        response: {
          subject: '',
          body: '',
          tone: 'professional',
          strategy: 'Error occurred',
          shouldSend: false,
          reasoning: error.message,
        },
        sent: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // STEP 1: EMAIL ANALYSIS
  // ============================================

  private async analyzeEmail(email: EmailQueueItem): Promise<EmailAnalysis> {
    try {
      return await this.responseGenerator.analyzeEmail(
        email.subject,
        email.body,
        email.from
      );
    } catch (error: any) {
      console.warn(`⚠️  AI analysis failed, using template analysis`);
      return this.basicAnalysis(email);
    }
  }

  private basicAnalysis(email: EmailQueueItem): EmailAnalysis {
    const bodyLower = email.body.toLowerCase();
    const subjectLower = email.subject.toLowerCase();

    // Detect intent
    let intent: EmailAnalysis['intent'] = 'other';
    if (bodyLower.includes('interested') || bodyLower.includes('available')) {
      intent = 'inquiry';
    } else if (bodyLower.includes('offer') || bodyLower.includes('$')) {
      intent = 'offer';
    } else if (bodyLower.includes('buy') || bodyLower.includes('purchase')) {
      intent = 'closing';
    } else if (bodyLower.includes('problem') || bodyLower.includes('issue')) {
      intent = 'complaint';
    }

    // Detect urgency
    let urgency: EmailAnalysis['urgency'] = 'medium';
    if (bodyLower.includes('urgent') || bodyLower.includes('asap') || bodyLower.includes('quickly')) {
      urgency = 'high';
    }

    // Detect sentiment
    let sentiment: EmailAnalysis['sentiment'] = 'neutral';
    if (bodyLower.includes('thank') || bodyLower.includes('great') || bodyLower.includes('love')) {
      sentiment = 'positive';
    } else if (bodyLower.includes('disappointed') || bodyLower.includes('unhappy')) {
      sentiment = 'negative';
    }

    // Extract price offer
    const priceMatch = email.body.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const priceOffer = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : undefined;

    return {
      intent,
      urgency,
      sentiment,
      confidence: 0.6,
      keyPoints: [email.subject],
      priceOffer,
    };
  }

  // ============================================
  // STEP 2: BUILD CONTEXT
  // ============================================

  private async buildContext(
    email: EmailQueueItem,
    analysis: EmailAnalysis
  ): Promise<ResponseContext> {
    // Get buyer profile
    const buyerProfile = await this.getBuyerProfile(email.from);

    // Get product information (from analysis or default)
    const product = analysis.product || 'Product'; // In real system, look up from database
    const productCost = 100; // In real system, look up from database
    const targetPrice = 150; // In real system, look up from database

    // Get market data if product identified
    let marketData: MarketData | undefined;
    if (analysis.product) {
      try {
        marketData = await this.marketAgent.analyzeProduct(analysis.product);
        console.log(`   📊 Market data: avg $${marketData.average}, demand: ${marketData.demand}`);
      } catch (error) {
        console.warn(`   ⚠️  Market analysis failed, using defaults`);
      }
    }

    // Build context
    const context: ResponseContext = {
      buyerEmail: email.from,
      product,
      productCost,
      targetPrice,
      currentPrice: analysis.priceOffer || targetPrice,
      buyerProfile,
      marketData,
    };

    return context;
  }

  private async getBuyerProfile(email: string): Promise<BuyerProfile | undefined> {
    try {
      const profile = await this.contextStore.getBuyerProfile(email);
      if (profile) {
        console.log(`   👤 Buyer profile found: ${profile.negotiationStyle}, ${profile.priceSensitivity} price sensitivity`);
      }
      return profile;
    } catch (error) {
      console.warn(`   ⚠️  Could not load buyer profile`);
      return undefined;
    }
  }

  // ============================================
  // STEP 3: GENERATE RESPONSE
  // ============================================

  private async generateResponse(
    analysis: EmailAnalysis,
    context: ResponseContext,
    email: EmailQueueItem
  ): Promise<GeneratedResponse> {
    const useAI = process.env.USE_AI_RESPONSES !== 'false';

    if (useAI) {
      try {
        return await this.responseGenerator.generateResponse(
          analysis,
          context,
          {
            subject: email.subject,
            body: email.body,
            from: email.from,
          }
        );
      } catch (error) {
        console.warn(`   ⚠️  AI generation failed, using template`);
      }
    }

    // Fallback to templates
    return this.responseGenerator.generateTemplateResponse(analysis, context);
  }

  // ============================================
  // STEP 4: SEND RESPONSE
  // ============================================

  private async sendResponse(
    email: EmailQueueItem,
    response: GeneratedResponse
  ): Promise<boolean> {
    try {
      // Add delay to appear more human
      const delay = parseInt(process.env.EMAIL_RESPONSE_DELAY || '5', 10);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      // Always send as a new email (thread replies via AgentMail API don't work)
      // Add "Re:" prefix to subject if replying to an existing email
      const subject = email.threadId && !response.subject.startsWith('Re:')
        ? `Re: ${email.subject}`
        : response.subject;

      await this.emailService.sendEmail(
        [email.from],
        subject,
        response.body,
        response.html
      );

      console.log(`   📤 Response sent successfully to ${email.from}`);
      return true;
    } catch (error: any) {
      console.error(`   ❌ Failed to send response:`, error.message);
      return false;
    }
  }

  // ============================================
  // STEP 5: RECORD INTERACTION
  // ============================================

  private async recordInteraction(
    email: EmailQueueItem,
    analysis: EmailAnalysis,
    response: GeneratedResponse
  ): Promise<void> {
    try {
      await this.contextStore.recordInteraction({
        buyerEmail: email.from,
        product: analysis.product || 'Unknown',
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        priceDiscussed: analysis.priceOffer,
        responseStrategy: response.strategy,
        timestamp: new Date(),
      });

      console.log(`   💾 Interaction recorded for learning`);
    } catch (error) {
      console.warn(`   ⚠️  Could not record interaction`);
    }
  }

  // ============================================
  // BATCH PROCESSING
  // ============================================

  /**
   * Process all pending emails in queue
   */
  async processPendingEmails(limit: number = 5): Promise<ProcessedEmail[]> {
    const pending = await this.emailService.getPendingEmails(limit);

    if (pending.length === 0) {
      return [];
    }

    console.log(`\n📬 Processing ${pending.length} pending emails...`);

    const results: ProcessedEmail[] = [];

    for (const email of pending) {
      const result = await this.processEmail(email);
      results.push(result);

      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Processed ${results.length} emails`);
    return results;
  }

  // ============================================
  // UTILITY
  // ============================================

  private getDefaultContext(buyerEmail: string): ResponseContext {
    return {
      buyerEmail,
      product: 'Product',
      productCost: 100,
      targetPrice: 150,
      currentPrice: 150,
    };
  }

  setAutoRespond(enabled: boolean): void {
    this.autoRespond = enabled;
    console.log(`📧 Auto-respond ${enabled ? 'enabled' : 'disabled'}`);
  }
}
