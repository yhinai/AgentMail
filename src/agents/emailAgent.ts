// EmailAgent - AgentMail integration for automated buyer communication
import OpenAI from 'openai';
import { ContextStore } from '../memory/contextStore';
import axios from 'axios';
import type {
  EmailMessage,
  EmailAnalysis,
  Strategy,
  ResponseStrategy,
  MarketData,
} from '../types';

// AgentMail SDK Interface - matches @agentmail/sdk pattern
interface AgentMailClient {
  getUnread(): Promise<EmailMessage[]>;
  sendEmail(to: string, subject: string, body: string, threadId?: string): Promise<void>;
  getThread(threadId: string): Promise<EmailMessage[]>;
  markAsRead(messageId: string): Promise<void>;
}

// Real AgentMail SDK Implementation using HTTP API
class AgentMailSDK implements AgentMailClient {
  private apiKey: string;
  private baseUrl: string;
  private possibleEndpoints: string[];
  private workingEndpoint: string | null = null;
  private inboxId: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Try multiple possible endpoints (agentmail.to is the official domain)
    this.possibleEndpoints = [
      process.env.AGENTMAIL_API_URL,
      'https://api.agentmail.to/v0',
      'https://api.agentmail.to/v1',
      'https://api.agentmail.com/v1',
      'https://api.agentmail.io/v1',
      'https://agentmail.com/api/v1',
      'https://app.agentmail.com/api/v1',
    ].filter(Boolean) as string[];

    this.baseUrl = this.possibleEndpoints[0];
    console.log(`[AgentMail] Initialized with primary endpoint: ${this.baseUrl}`);
    console.log(`[AgentMail] Will try ${this.possibleEndpoints.length} possible endpoints if needed`);

    // Initialize inbox asynchronously
    this.initializeInbox().catch(err => {
      console.warn(`[AgentMail] Failed to initialize inbox: ${err.message}`);
    });
  }

  private async initializeInbox(): Promise<void> {
    try {
      // Get or create default inbox
      const response = await this.tryEndpoints(async (baseUrl) => {
        return await axios.get(`${baseUrl}/inboxes`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      });

      if (response.data.count > 0) {
        this.inboxId = response.data.inboxes[0].inbox_id;
        console.log(`[AgentMail] ✅ Using existing inbox: ${this.inboxId}`);
      } else {
        // Create new inbox
        const createResponse = await axios.post(
          `${this.workingEndpoint}/inboxes`,
          { name: 'AgentMail Auto-Created Inbox' },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        this.inboxId = createResponse.data.inbox_id;
        console.log(`[AgentMail] ✅ Created new inbox: ${this.inboxId}`);
      }
    } catch (error: any) {
      console.warn(`[AgentMail] Could not initialize inbox: ${error.message}`);
    }
  }

  private async tryEndpoints<T>(
    operation: (url: string) => Promise<T>
  ): Promise<T> {
    // If we already found a working endpoint, use it
    if (this.workingEndpoint) {
      try {
        return await operation(this.workingEndpoint);
      } catch (error: any) {
        // If the working endpoint fails, reset and try all again
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.warn(`[AgentMail] Previously working endpoint ${this.workingEndpoint} is now unreachable`);
          this.workingEndpoint = null;
        } else {
          throw error;
        }
      }
    }

    // Try each endpoint until one works
    let lastError: any;
    for (const endpoint of this.possibleEndpoints) {
      try {
        const result = await operation(endpoint);
        this.workingEndpoint = endpoint;
        console.log(`[AgentMail] ✅ Found working endpoint: ${endpoint}`);
        return result;
      } catch (error: any) {
        lastError = error;
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
            error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' ||
            error.message?.includes('ECONNRESET')) {
          console.warn(`[AgentMail] Endpoint ${endpoint} not reachable (${error.code}), trying next...`);
          continue;
        }
        // If it's not a network error, throw it
        throw error;
      }
    }

    // All endpoints failed
    throw lastError;
  }

  async getUnread(): Promise<EmailMessage[]> {
    try {
      if (!this.inboxId) {
        console.warn('[AgentMail] No inbox configured yet, using fallback mode');
        return [];
      }

      const response = await this.tryEndpoints(async (baseUrl) => {
        return await axios.get(`${baseUrl}/inboxes/${encodeURIComponent(this.inboxId!)}/messages`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      });

      return response.data.messages.map((msg: any) => ({
        id: msg.message_id || msg.id,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        body: msg.body || msg.text || msg.html,
        threadId: msg.thread_id || msg.threadId,
        timestamp: new Date(msg.timestamp || msg.created_at || msg.createdAt),
        attachments: msg.attachments?.map((att: any) => ({
          filename: att.filename,
          contentType: att.contentType || att.content_type,
          content: Buffer.from(att.content, 'base64'),
        })),
      }));
    } catch (error: any) {
      // Handle network errors, DNS failures, and API errors gracefully
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ||
          error.response?.status === 404 || !this.apiKey) {
        console.warn(`[AgentMail] API endpoint not reachable (${error.code || error.response?.status}), using fallback mode`);
        return [];
      }
      throw new Error(`Failed to get unread messages: ${error.message}`);
    }
  }

  async sendEmail(to: string, subject: string, body: string, threadId?: string): Promise<void> {
    try {
      if (!this.inboxId) {
        console.warn(`[AgentMail] No inbox configured, email would be sent to ${to}: ${subject}`);
        return;
      }

      await this.tryEndpoints(async (baseUrl) => {
        return await axios.post(
          `${baseUrl}/inboxes/${encodeURIComponent(this.inboxId!)}/messages/send`,
          {
            to,
            subject,
            body,
            thread_id: threadId,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
      });
      console.log(`[AgentMail] ✅ Email sent to ${to}: ${subject}`);
    } catch (error: any) {
      // Handle network errors, DNS failures, and API errors gracefully
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ||
          error.response?.status === 404 || !this.apiKey) {
        console.warn(`[AgentMail] API endpoint not reachable, email would be sent to ${to}: ${subject}`);
        return;
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async getThread(threadId: string): Promise<EmailMessage[]> {
    try {
      if (!this.inboxId) {
        console.warn('[AgentMail] No inbox configured, returning empty thread');
        return [];
      }

      const response = await axios.get(
        `${this.workingEndpoint}/inboxes/${encodeURIComponent(this.inboxId)}/threads/${threadId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.messages.map((msg: any) => ({
        id: msg.message_id || msg.id,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        body: msg.body || msg.text || msg.html,
        threadId: msg.thread_id || msg.threadId,
        timestamp: new Date(msg.timestamp || msg.created_at || msg.createdAt),
        attachments: msg.attachments?.map((att: any) => ({
          filename: att.filename,
          contentType: att.contentType || att.content_type,
          content: Buffer.from(att.content, 'base64'),
        })),
      }));
    } catch (error: any) {
      // Handle network errors, DNS failures, and API errors gracefully
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ||
          error.response?.status === 404 || !this.apiKey) {
        console.warn('[AgentMail] API endpoint not reachable, returning empty thread');
        return [];
      }
      throw new Error(`Failed to get thread: ${error.message}`);
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      if (!this.inboxId) {
        console.warn('[AgentMail] No inbox configured, mark as read skipped');
        return;
      }

      await axios.patch(
        `${this.workingEndpoint}/inboxes/${encodeURIComponent(this.inboxId)}/messages/${messageId}`,
        { read: true },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      // Handle network errors, DNS failures, and API errors gracefully
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ||
          error.response?.status === 404 || !this.apiKey) {
        console.warn('[AgentMail] API endpoint not reachable, mark as read skipped');
        return;
      }
      console.error(`Failed to mark message as read: ${error.message}`);
    }
  }
}

export class EmailAgent {
  private agentmail: AgentMailClient;
  private openai: OpenAI;
  private contextStore: ContextStore;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor(contextStore: ContextStore) {
    const apiKey = process.env.AGENTMAIL_API_KEY || '';
    
    // Initialize AgentMail client with real SDK
    if (apiKey) {
      this.agentmail = new AgentMailSDK(apiKey);
    } else {
      // Fallback implementation if SDK package available
      try {
        // Try to use @agentmail/sdk if installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AgentMail = require('@agentmail/sdk');
        this.agentmail = new AgentMail({ apiKey });
      } catch {
        // Use HTTP API implementation
        this.agentmail = new AgentMailSDK('');
        console.warn('AgentMail SDK not found, using HTTP API fallback');
      }
    }

    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    this.contextStore = contextStore;
  }

  /**
   * Start monitoring for incoming emails
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Email monitoring already started');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting email monitoring...');

    // Check for emails every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForNewEmails();
      } catch (error) {
        console.error('Error checking for emails:', error);
      }
    }, 30000);

    // Also check immediately
    await this.checkForNewEmails();
  }

  /**
   * Stop monitoring for incoming emails
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Email monitoring stopped');
  }

  /**
   * Check for and process new emails
   */
  private async checkForNewEmails(): Promise<void> {
    const messages = await this.agentmail.getUnread();
    
    for (const message of messages) {
      try {
        await this.processMessage(message);
        // Mark as read after processing
        await this.agentmail.markAsRead(message.id);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }
  }

  /**
   * Process a single email message
   */
  async processMessage(message: EmailMessage): Promise<void> {
    console.log(`Processing email from ${message.from}: ${message.subject}`);

    // Analyze the email
    const analysis = await this.analyzeEmail(message);

    // Get buyer context
    const buyerContext = await this.contextStore.getBuyerProfile(message.from);

    // Calculate strategy (this might need market data, which would come from orchestrator)
    const strategy = await this.contextStore.getOptimalStrategy(
      message.from,
      analysis.product || 'unknown'
    );

    // Generate response
    const response = await this.generateResponse(message, analysis, strategy);

    // Send response
    await this.sendResponse(message, response);

    // Record interaction
    await this.contextStore.recordInteraction({
      buyer: message.from,
      intent: analysis.intent,
      product: analysis.product || 'unknown',
      timestamp: message.timestamp,
    });
  }

  /**
   * Analyze email content to extract intent, product, price, etc.
   */
  async analyzeEmail(message: EmailMessage): Promise<EmailAnalysis> {
    const prompt = `Analyze this email from a potential buyer. Extract:
1. Intent: inquiry, offer, negotiation, closing, or other
2. Product name (if mentioned)
3. Price mentioned (if any)
4. Urgency level: low, medium, or high
5. Sentiment: positive, neutral, or negative
6. Confidence score (0-1)

Email subject: ${message.subject}
Email body: ${message.body}

Respond in JSON format:
{
  "intent": "inquiry|offer|negotiation|closing|other",
  "product": "product name or null",
  "price": number or null,
  "urgency": "low|medium|high",
  "sentiment": "positive|neutral|negative",
  "confidence": 0.0-1.0
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email analyst for an e-commerce platform. Extract key information from buyer emails. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(content) as EmailAnalysis;
      return analysis;
    } catch (error) {
      console.error('Error analyzing email:', error);
      // Return default analysis
      return {
        intent: 'other',
        urgency: 'medium',
        sentiment: 'neutral',
        confidence: 0.5,
      };
    }
  }

  /**
   * Generate response email using strategy and context
   */
  async generateResponse(
    message: EmailMessage,
    analysis: EmailAnalysis,
    strategy: Strategy,
    marketData?: MarketData
  ): Promise<string> {
    const systemPrompt = `You are a professional sales agent for an e-commerce platform. Generate a ${strategy.tone} response that:
${strategy.closeAttempt ? '- Attempts to close the deal NOW' : ''}
- Offers a price of $${strategy.pricePoint}${strategy.flexibility > 0 ? ` (willing to negotiate)` : ''}
- Shows ${(strategy.flexibility * 100).toFixed(0)}% flexibility on price
- Includes these incentives: ${strategy.closingIncentives.join(', ')}
- Matches the buyer's communication style
- Is concise but informative
- Creates urgency when appropriate`;

    const userPrompt = `Buyer email:
Subject: ${message.subject}
Body: ${message.body}

Product: ${analysis.product || 'Not specified'}
Buyer's offer: ${analysis.price ? `$${analysis.price}` : 'No specific offer'}
Intent: ${analysis.intent}
Urgency: ${analysis.urgency}

${marketData ? `Market average price: $${marketData.average}` : ''}

Generate a professional response email.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'Thank you for your interest. We will get back to you shortly.';
    } catch (error) {
      console.error('Error generating response:', error);
      return this.getDefaultResponse(analysis.intent, strategy);
    }
  }

  /**
   * Send response email
   */
  async sendResponse(message: EmailMessage, response: string): Promise<void> {
    const subject = message.subject.startsWith('Re:') 
      ? message.subject 
      : `Re: ${message.subject}`;

    await this.agentmail.sendEmail(
      message.from,
      subject,
      response,
      message.threadId
    );

    console.log(`Response sent to ${message.from}`);
  }

  /**
   * Send confirmation email for closed deal
   */
  async sendConfirmation(buyerEmail: string, product: string, finalPrice: number): Promise<void> {
    const subject = 'Deal Confirmed - Thank You!';
    const body = `Thank you for your purchase!

Product: ${product}
Final Price: $${finalPrice}

We'll process your order and send you tracking information shortly.

Best regards,
ProfitPilot Team`;

    await this.agentmail.sendEmail(buyerEmail, subject, body);
  }

  /**
   * Get default response template
   */
  private getDefaultResponse(intent: string, strategy: Strategy): string {
    switch (intent) {
      case 'inquiry':
        return `Thank you for your interest! I'd be happy to help you with that. The price is $${strategy.pricePoint}. Would you like to proceed?`;
      case 'offer':
        return `Thank you for your offer. I can offer it to you for $${strategy.pricePoint}. ${strategy.closingIncentives.length > 0 ? `As a bonus, ${strategy.closingIncentives[0]}.` : ''} Let me know if this works for you!`;
      case 'negotiation':
        return `I appreciate your offer. I can do $${strategy.pricePoint}. ${strategy.closeAttempt ? 'This is the best price I can offer. Are you ready to proceed?' : 'Let me know what you think!'}`;
      default:
        return `Thank you for contacting us. We'll get back to you shortly with more information.`;
    }
  }

  // Public methods for orchestrator
  public async analyzeEmailPublic(message: EmailMessage): Promise<EmailAnalysis> {
    return this.analyzeEmail(message);
  }

  public async generateResponsePublic(
    message: EmailMessage,
    analysis: EmailAnalysis,
    strategy: Strategy,
    marketData?: MarketData
  ): Promise<string> {
    return this.generateResponse(message, analysis, strategy, marketData);
  }

  public async sendResponsePublic(message: EmailMessage, response: string): Promise<void> {
    return this.sendResponse(message, response);
  }

  public async sendConfirmationPublic(buyerEmail: string, product: string, finalPrice: number): Promise<void> {
    return this.sendConfirmation(buyerEmail, product, finalPrice);
  }
}