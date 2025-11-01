import OpenAI from 'openai';
import { AgentMailClient } from './agentMailClient';
import { ContextStore } from '../memory/contextStore';
import {
  EmailMessage,
  EmailAnalysis,
  ResponseStrategy,
  EmailIntent,
  Interaction,
} from '../types';
import { Logger } from '../utils/logger';
import { retry, RetryOptions } from '../utils/retry';

export class EmailAgent {
  private agentmail: AgentMailClient;
  private openai: OpenAI;
  private contextStore: ContextStore;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor(
    agentmailClient: AgentMailClient,
    openaiClient: OpenAI,
    contextStore: ContextStore
  ) {
    this.agentmail = agentmailClient;
    this.openai = openaiClient;
    this.contextStore = contextStore;
  }

  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isMonitoring) {
      Logger.warn('Email monitoring already started');
      return;
    }

    this.isMonitoring = true;
    Logger.info(`Starting email monitoring (checking every ${intervalMs}ms)`);

    // Initial check
    await this.checkForNewMessages();

    // Set up interval
    this.monitoringInterval = setInterval(async () => {
      await this.checkForNewMessages();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.isMonitoring = false;
      Logger.info('Email monitoring stopped');
    }
  }

  private async checkForNewMessages(): Promise<void> {
    try {
      const messages = await retry(
        () => this.agentmail.getUnread(),
        {
          maxAttempts: 3,
          delay: 1000,
          exponentialBackoff: true,
          maxDelay: 10000,
        }
      );

      if (messages.length > 0) {
        Logger.info(`Found ${messages.length} new message(s)`);
      }

      for (const message of messages) {
        await this.processMessage(message);
      }
    } catch (error) {
      Logger.error('Error checking for new messages', error);
    }
  }

  async processMessage(message: EmailMessage): Promise<void> {
    const startTime = Date.now();
    Logger.info(`Processing email from ${message.from}: ${message.subject}`);

    try {
      // Analyze email
      const analysis = await this.analyzeEmail(message);

      // Get buyer context
      const buyerProfile = await this.contextStore.getBuyerProfile(message.from);

      // Calculate negotiation strategy
      const strategy = await this.calculateStrategy(analysis, buyerProfile);

      // Generate response
      const response = await this.generateResponse(message, analysis, strategy);

      // Send response
      await this.sendResponse(message, response);

      // Record interaction
      const responseTime = (Date.now() - startTime) / 1000;
      await this.contextStore.recordInteraction({
        buyer: message.from,
        intent: analysis.intent,
        product: analysis.product,
        timestamp: new Date(),
        responseTime,
        outcome: 'positive',
      });

      // Mark as read
      await this.agentmail.markAsRead(message.id);

      Logger.info(
        `Email processed and responded in ${responseTime.toFixed(2)}s`
      );
    } catch (error) {
      Logger.error(`Error processing message ${message.id}`, error);
      throw error;
    }
  }

  private async analyzeEmail(message: EmailMessage): Promise<EmailAnalysis> {
    Logger.debug('Analyzing email content');

    const prompt = `Analyze this email from a potential buyer. Extract:
1. Intent (inquiry, negotiation, offer, acceptance, rejection, question, complaint, other)
2. Product mentioned (if any)
3. Price mentioned (if any)
4. Sentiment (positive, neutral, negative)
5. Urgency level (0-1)
6. Closing signals (phrases indicating willingness to buy)
7. Keywords related to buying/selling

Email:
Subject: ${message.subject}
Body: ${message.body}

Respond in JSON format:
{
  "intent": "inquiry|negotiation|offer|acceptance|rejection|question|complaint|other",
  "product": "product name or null",
  "priceMentioned": number or null,
  "sentiment": "positive|neutral|negative",
  "urgency": 0-1,
  "closingSignals": ["signal1", "signal2"],
  "keywords": ["keyword1", "keyword2"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at analyzing buyer emails in e-commerce. Extract structured information.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content) as EmailAnalysis;
      
      // Ensure required fields exist
      return {
        intent: (analysis.intent || 'other') as EmailIntent,
        product: analysis.product,
        priceMentioned: analysis.priceMentioned,
        sentiment: analysis.sentiment || 'neutral',
        urgency: analysis.urgency ?? 0.5,
        closingSignals: analysis.closingSignals || [],
        keywords: analysis.keywords || [],
      };
    } catch (error) {
      Logger.error('Error analyzing email', error);
      // Return default analysis
      return {
        intent: 'other',
        sentiment: 'neutral',
        urgency: 0.5,
        closingSignals: [],
        keywords: [],
      };
    }
  }

  private async calculateStrategy(
    analysis: EmailAnalysis,
    buyerProfile: any
  ): Promise<ResponseStrategy> {
    Logger.debug('Calculating response strategy');

    const optimalStrategy = await this.contextStore.getOptimalStrategy(
      analysis.product || 'unknown',
      buyerProfile.email || ''
    );

    // Adjust strategy based on email analysis
    let pricePoint = optimalStrategy.initialPrice;
    let closeAttempt = false;

    if (analysis.intent === 'offer' && analysis.priceMentioned) {
      // Counter-offer logic
      const offeredPrice = analysis.priceMentioned;
      if (offeredPrice >= optimalStrategy.minAcceptable) {
        // Accept or counter slightly higher
        pricePoint = Math.max(
          offeredPrice * 1.05,
          optimalStrategy.minAcceptable
        );
        closeAttempt = true;
      } else if (offeredPrice >= optimalStrategy.minAcceptable * 0.9) {
        // Counter with small discount
        pricePoint = Math.max(
          optimalStrategy.minAcceptable,
          (offeredPrice + optimalStrategy.minAcceptable) / 2
        );
      }
    } else if (analysis.intent === 'acceptance') {
      closeAttempt = true;
    } else if (analysis.urgency > 0.7 || analysis.closingSignals.length > 0) {
      closeAttempt = true;
    }

    return {
      ...optimalStrategy,
      pricePoint,
      closeAttempt,
    };
  }

  async generateResponse(
    message: EmailMessage,
    analysis: EmailAnalysis,
    strategy: ResponseStrategy
  ): Promise<string> {
    Logger.debug('Generating email response');

    const systemPrompt = `You are a professional e-commerce seller responding to a buyer inquiry. 
Generate a ${strategy.tone} response that:
- Offers the product at $${strategy.pricePoint.toFixed(2)}
- Shows ${(strategy.flexibility * 100).toFixed(0)}% flexibility on price
- Includes these incentives: ${strategy.incentives.join(', ')}
${strategy.closeAttempt ? '- Attempts to close the deal NOW' : ''}
- Be professional, helpful, and persuasive
- Keep response concise (2-3 paragraphs max)
- Address any questions from the buyer's email`;

    const userPrompt = `Buyer's email:
Subject: ${message.subject}
Body: ${message.body}

${analysis.product ? `Product: ${analysis.product}` : ''}
${analysis.priceMentioned ? `Buyer mentioned price: $${analysis.priceMentioned}` : ''}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response generated');
      }

      return content;
    } catch (error) {
      Logger.error('Error generating response', error);
      // Fallback template
      return this.getFallbackResponse(message, analysis, strategy);
    }
  }

  private getFallbackResponse(
    message: EmailMessage,
    analysis: EmailAnalysis,
    strategy: ResponseStrategy
  ): string {
    if (analysis.intent === 'inquiry') {
      return `Hi,

Thanks for your interest! The item is available for $${strategy.pricePoint.toFixed(2)}.

${strategy.incentives.length > 0 ? `I'm offering: ${strategy.incentives.join(', ')}.` : ''}

Let me know if you have any questions!

Best regards`;
    }

    if (analysis.intent === 'offer' && analysis.priceMentioned) {
      return `Hi,

Thanks for your offer of $${analysis.priceMentioned.toFixed(2)}. 

I can do $${strategy.pricePoint.toFixed(2)} ${strategy.closeAttempt ? '- this is my best price and I can move fast if you're ready!' : ''}

${strategy.incentives.join('. ')}

Let me know!

Best regards`;
    }

    return `Hi,

Thanks for reaching out. I'd be happy to help!

Best regards`;
  }

  private async sendResponse(
    message: EmailMessage,
    response: string
  ): Promise<void> {
    const subject = message.subject.startsWith('Re:')
      ? message.subject
      : `Re: ${message.subject}`;

    await retry(
      () =>
        this.agentmail.replyToMessage(message.id, response),
      {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
        maxDelay: 10000,
      }
    );

    Logger.info(`Response sent to ${message.from}`);
  }

  async sendConfirmation(
    buyerEmail: string,
    product: string,
    finalPrice: number
  ): Promise<void> {
    const subject = `Purchase Confirmation - ${product}`;
    const body = `Hi,

Great news! Your purchase of ${product} for $${finalPrice.toFixed(2)} is confirmed.

We'll coordinate pickup/delivery details shortly.

Thank you for your business!

Best regards,
ProfitPilot`;

    await this.agentmail.sendEmail(buyerEmail, subject, body);
    Logger.info(`Confirmation email sent to ${buyerEmail}`);
  }
}

