// Negotiation Agent - Advanced email negotiation system with 4 strategies
import { EventEmitter } from 'events';
import { AgentMailIntegration } from '../integrations/AgentMailIntegration';
import { OpenAIIntegration } from '../integrations/OpenAIIntegration';
import { HyperspellIntegration } from '../integrations/HyperspellIntegration';
import type { Agent } from '../core/agents/AgentRegistry';
import type {
  EnrichedOpportunity,
  DealAnalysis,
  NegotiationStrategy,
  NegotiationThread,
  NegotiationResult,
  SellerHistory,
  SellerContact,
  EmailContent,
  IncomingEmail,
  ResponseAnalysis,
  NegotiationRound
} from '../types';
import { SystemEvents } from '../types';
import { ResponseAnalyzer } from './ResponseAnalyzer';
import { EmailTemplateEngine } from './EmailTemplateEngine';

interface NegotiationConfig {
  agentMail: AgentMailIntegration;
  openai: OpenAIIntegration;
  hyperspell: HyperspellIntegration;
}

export class NegotiationAgent extends EventEmitter implements Agent {
  public readonly name = 'negotiation';
  public status: 'idle' | 'active' | 'error' | 'stopped' = 'idle';
  
  private agentMail: AgentMailIntegration;
  private openai: OpenAIIntegration;
  private hyperspell: HyperspellIntegration;
  private activeThreads: Map<string, NegotiationThread>;
  private strategies: Map<string, NegotiationStrategy>;
  private templates: EmailTemplateEngine;
  private responseAnalyzer: ResponseAnalyzer;
  
  constructor(config: NegotiationConfig) {
    super();
    
    this.agentMail = config.agentMail;
    this.openai = config.openai;
    this.hyperspell = config.hyperspell;
    this.activeThreads = new Map();
    this.strategies = this.loadStrategies();
    this.templates = new EmailTemplateEngine(this.openai);
    this.responseAnalyzer = new ResponseAnalyzer(this.openai);
  }
  
  async start(): Promise<void> {
    this.status = 'active';
    // Start monitoring for incoming emails
    this.startMonitoring();
  }
  
  async stop(): Promise<void> {
    this.status = 'stopped';
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const agentMailHealth = await this.agentMail.healthCheck();
      const openaiHealth = await this.openai.healthCheck();
      const hyperspellHealth = await this.hyperspell.healthCheck();
      return agentMailHealth.healthy && openaiHealth.healthy && hyperspellHealth.healthy;
    } catch {
      return false;
    }
  }
  
  async initiateNegotiation(
    opportunity: EnrichedOpportunity,
    analysis: DealAnalysis,
    strategyName?: string
  ): Promise<NegotiationResult> {
    this.status = 'active';
    
    try {
      // Select strategy
      const strategy = strategyName 
        ? this.strategies.get(strategyName)
        : this.selectOptimalStrategy(opportunity, analysis);
      
      if (!strategy) {
        throw new Error('No suitable negotiation strategy found');
      }
      
      // Get seller contact info
      const sellerContact = await this.extractSellerContact(opportunity);
      
      // Retrieve seller history
      const sellerHistory = await this.getSellerHistory(sellerContact);
      
      // Generate personalized email
      const emailContent = await this.generateInitialEmail(
        opportunity,
        analysis,
        strategy,
        sellerHistory
      );
      
      // Send email
      const emailResult = await this.agentMail.sendEmail({
        to: sellerContact.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        headers: {
          'X-Opportunity-ID': opportunity.id,
          'X-Strategy': strategy.name,
          'X-Round': '1'
        },
        scheduleSend: this.calculateOptimalSendTime(sellerHistory),
        trackingSettings: {
          opens: true,
          clicks: true,
          unsubscribe: false
        }
      });
      
      // Create negotiation thread
      const initialOffer = this.calculateInitialOffer(opportunity.price, strategy);
      const thread: NegotiationThread = {
        id: emailResult.messageId,
        opportunityId: opportunity.id,
        strategy: strategy.name,
        sellerContact,
        rounds: [{
          number: 1,
          timestamp: new Date(),
          type: 'initial_offer',
          ourOffer: initialOffer,
          message: emailContent.text,
          messageId: emailResult.messageId,
          status: 'sent'
        }],
        status: 'active',
        currentOffer: initialOffer,
        maxAcceptable: analysis.recommendation.maxPrice,
        metrics: {
          responseTime: null,
          openTime: null,
          clickCount: 0
        }
      };
      
      // Store thread
      this.activeThreads.set(thread.id, thread);
      
      // Store in memory system
      await this.storeNegotiationMemory(thread);
      
      // Schedule follow-up
      this.scheduleFollowUp(thread, strategy);
      
      // Emit event
      this.emit('negotiation:started', thread);
      
      this.status = 'idle';
      
      return {
        success: true,
        threadId: thread.id,
        initialOffer: thread.currentOffer,
        strategy: strategy.name
      };
    } catch (error) {
      this.status = 'error';
      console.error('Negotiation initiation error:', error);
      throw error;
    }
  }
  
  async handleIncomingEmail(email: IncomingEmail): Promise<void> {
    // Find associated thread
    const thread = this.findThreadByEmail(email);
    if (!thread) {
      await this.handleColdInbound(email);
      return;
    }
    
    // Analyze response
    const analysis = await this.responseAnalyzer.analyze(email, thread);
    
    // Update thread metrics
    if (thread.rounds.length > 0) {
      const lastRound = thread.rounds[thread.rounds.length - 1];
      thread.metrics.responseTime = Date.now() - lastRound.timestamp.getTime();
      thread.lastResponseTime = new Date();
    }
    
    // Process based on analysis
    switch (analysis.intent) {
      case 'ACCEPT':
        await this.handleAcceptance(thread, analysis);
        break;
        
      case 'COUNTER':
        await this.handleCounterOffer(thread, analysis);
        break;
        
      case 'REJECT':
        await this.handleRejection(thread, analysis);
        break;
        
      case 'QUESTION':
        await this.handleQuestion(thread, analysis);
        break;
        
      case 'NEGOTIATE':
        await this.handleNegotiation(thread, analysis);
        break;
        
      default:
        await this.handleUnclear(thread, analysis);
    }
    
    // Update memory
    await this.updateNegotiationMemory(thread);
    
    // Emit event
    this.emit('negotiation:updated', thread);
  }
  
  private selectOptimalStrategy(
    opportunity: EnrichedOpportunity,
    analysis: DealAnalysis
  ): NegotiationStrategy | undefined {
    const profitMargin = analysis.profitMargin;
    const sellerType = analysis.sellerProfile?.type;
    
    if (profitMargin > 50 && analysis.opportunity.profitAnalysis && analysis.opportunity.profitAnalysis.profitMargin > 50) {
      return this.strategies.get('URGENT_CASH');
    } else if (sellerType === 'business') {
      return this.strategies.get('PROFESSIONAL_BUYER');
    } else if (opportunity.category === 'collectibles') {
      return this.strategies.get('COLLECTOR');
    } else {
      return this.strategies.get('FRIENDLY_LOCAL');
    }
  }
  
  private async extractSellerContact(opportunity: EnrichedOpportunity): Promise<SellerContact> {
    // Extract seller contact information
    // This would typically come from scraping the listing page
    return {
      email: opportunity.seller.id + '@platform.com', // Placeholder
      name: opportunity.seller.name,
      platform: opportunity.platform
    };
  }
  
  private async getSellerHistory(contact: SellerContact): Promise<SellerHistory> {
    // Retrieve seller history from Hyperspell
    const memory = await this.hyperspell.retrieve(`seller:${contact.email}`);
    
    if (memory) {
      return {
        email: contact.email,
        interactions: memory.data.interactions || [],
        responseRate: memory.data.responseRate || 0.5,
        averageDiscount: memory.data.averageDiscount || 0,
        preferredCommunicationStyle: memory.data.preferredStyle
      };
    }
    
    return {
      email: contact.email,
      interactions: [],
      responseRate: 0.5,
      averageDiscount: 0
    };
  }
  
  private calculateInitialOffer(listingPrice: number, strategy: NegotiationStrategy): number {
    return listingPrice * strategy.openingOffer;
  }
  
  private async generateInitialEmail(
    opportunity: EnrichedOpportunity,
    analysis: DealAnalysis,
    strategy: NegotiationStrategy,
    sellerHistory: SellerHistory
  ): Promise<EmailContent> {
    const offerAmount = this.calculateInitialOffer(opportunity.price, strategy);
    const systemPrompt = this.buildSystemPrompt(strategy);
    const userPrompt = this.buildUserPrompt({
      item: {
        title: opportunity.title,
        price: opportunity.price,
        condition: opportunity.condition,
        location: opportunity.location,
        platform: opportunity.platform,
        listingAge: this.calculateListingAge(opportunity.listingDate)
      },
      offer: {
        amount: offerAmount,
        justification: this.generateOfferJustification(opportunity, analysis),
        urgency: strategy.urgencyLevel
      },
      buyer: {
        persona: strategy.buyerPersona,
        tone: strategy.communicationTone,
        approach: strategy.approachStyle
      },
      seller: {
        previousInteractions: sellerHistory.interactions,
        responseRate: sellerHistory.responseRate,
        averageDiscount: sellerHistory.averageDiscount,
        preferredStyle: sellerHistory.preferredCommunicationStyle
      }
    });
    
    const response = await this.openai.jsonCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: strategy.creativity || 0.7,
      maxTokens: 500
    });
    
    const formatted = await this.templates.format(response, strategy.templateName);
    
    return {
      subject: response.subject,
      html: formatted.html,
      text: formatted.text,
      preview: response.preview
    };
  }
  
  private buildSystemPrompt(strategy: NegotiationStrategy): string {
    return `You are an expert negotiator using the ${strategy.name} strategy.

Persona: ${strategy.buyerPersona}
Tone: ${strategy.communicationTone}
Approach: ${strategy.approachStyle}

Key tactics:
${strategy.tactics.map(t => `- ${t}`).join('\n')}

Generate an email that:
1. Shows genuine interest in the item
2. Builds rapport with the seller
3. Presents a compelling offer
4. Creates appropriate urgency
5. Leaves room for negotiation
6. Maintains authenticity

Output JSON with:
- subject: Compelling subject line (max 60 chars)
- preview: Email preview text (max 100 chars)
- greeting: Personalized greeting
- opening: Opening statement showing interest
- offer: The offer paragraph with justification
- urgency: Urgency/scarcity element
- closing: Call to action
- signature: Sign-off`;
  }
  
  private buildUserPrompt(context: any): string {
    return `Generate a negotiation email with the following context:
${JSON.stringify(context, null, 2)}`;
  }
  
  private generateOfferJustification(opportunity: EnrichedOpportunity, analysis: DealAnalysis): string {
    const reasons: string[] = [];
    
    if (opportunity.condition && opportunity.condition !== 'new') {
      reasons.push(`Based on the ${opportunity.condition} condition`);
    }
    
    if (opportunity.marketData?.averagePrice) {
      const diff = opportunity.marketData.averagePrice - opportunity.price;
      if (diff > 0) {
        reasons.push(`Considering current market prices are around $${opportunity.marketData.averagePrice.toFixed(0)}`);
      }
    }
    
    return reasons.join(', ') || 'Based on market research';
  }
  
  private calculateOptimalSendTime(sellerHistory: SellerHistory): number | undefined {
    // Calculate optimal send time based on seller history
    // Default: send immediately
    return undefined;
  }
  
  private calculateListingAge(listingDate: Date): string {
    const ageMs = Date.now() - listingDate.getTime();
    const days = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
  
  private async handleAcceptance(thread: NegotiationThread, analysis: ResponseAnalysis): Promise<void> {
    thread.status = 'accepted';
    thread.finalPrice = thread.currentOffer;
    thread.savingsAchieved = (thread.rounds[0]?.ourOffer || 0) - thread.currentOffer;
    
    // Store in memory
    await this.updateNegotiationMemory(thread);
    
    // Emit event
    this.emit('negotiation:accepted', thread);
  }
  
  private async handleCounterOffer(thread: NegotiationThread, analysis: ResponseAnalysis): Promise<void> {
    const strategy = this.strategies.get(thread.strategy)!;
    const counterPrice = analysis.extractedPrice!;
    
    let response: EmailContent;
    let newStatus: string;
    
    if (counterPrice <= thread.maxAcceptable) {
      // Accept the counter
      response = await this.generateAcceptanceEmail(thread, counterPrice);
      newStatus = 'accepted';
      thread.finalPrice = counterPrice;
    } else if (counterPrice <= thread.maxAcceptable * 1.1 && thread.rounds.length < strategy.maxRounds) {
      // Make another counter offer
      const newOffer = this.calculateCounterOffer(
        thread.currentOffer,
        counterPrice,
        thread.maxAcceptable,
        thread.rounds.length
      );
      
      response = await this.generateCounterEmail(thread, newOffer, analysis);
      thread.currentOffer = newOffer;
      newStatus = 'negotiating';
    } else if (thread.rounds.length >= strategy.maxRounds) {
      // Final offer
      response = await this.generateFinalOfferEmail(thread);
      newStatus = 'final_offer';
    } else {
      // Continue negotiating
      const newOffer = this.calculateStrategicOffer(thread, counterPrice);
      response = await this.generateNegotiationEmail(thread, newOffer, analysis);
      thread.currentOffer = newOffer;
      newStatus = 'negotiating';
    }
    
    // Send response
    const emailResult = await this.agentMail.replyToEmail(thread.id, response, {
      'X-Round': (thread.rounds.length + 1).toString()
    });
    
    // Update thread
    thread.rounds.push({
      number: thread.rounds.length + 1,
      timestamp: new Date(),
      type: 'counter_response',
      theirOffer: counterPrice,
      ourOffer: thread.currentOffer,
      message: response.text,
      messageId: emailResult.messageId,
      status: newStatus
    });
    
    thread.status = newStatus as any;
  }
  
  private calculateCounterOffer(
    currentOffer: number,
    theirCounter: number,
    maxAcceptable: number,
    roundNumber: number
  ): number {
    const gap = theirCounter - currentOffer;
    const remainingBudget = maxAcceptable - currentOffer;
    const roundMultiplier = 1 - (roundNumber * 0.1);
    
    let newOffer: number;
    
    if (gap <= 50) {
      newOffer = currentOffer + (gap * 0.6);
    } else if (gap <= 100) {
      newOffer = currentOffer + (gap * 0.4 * roundMultiplier);
    } else {
      newOffer = currentOffer + Math.min(gap * 0.3 * roundMultiplier, remainingBudget * 0.5);
    }
    
    return Math.min(newOffer, maxAcceptable);
  }
  
  private calculateStrategicOffer(thread: NegotiationThread, theirCounter: number): number {
    const strategy = this.strategies.get(thread.strategy)!;
    return this.calculateCounterOffer(
      thread.currentOffer,
      theirCounter,
      thread.maxAcceptable,
      thread.rounds.length
    );
  }
  
  private async generateCounterEmail(
    thread: NegotiationThread,
    newOffer: number,
    analysis: ResponseAnalysis
  ): Promise<EmailContent> {
    const strategy = this.strategies.get(thread.strategy)!;
    
    const prompt = `Generate a counter-offer email:
    
    Context:
    - Their counter: $${analysis.extractedPrice}
    - Our new offer: $${newOffer}
    - Round: ${thread.rounds.length + 1}
    - Strategy: ${strategy.name}
    - Their sentiment: ${analysis.sentiment}
    - Their concerns: ${analysis.extractedConcerns?.join(', ')}
    
    Requirements:
    1. Acknowledge their counter professionally
    2. Justify our new offer with specific reasons
    3. Show flexibility but maintain boundaries
    4. Address any concerns they raised
    5. Keep momentum toward closing
    6. Tone: ${strategy.communicationTone}`;
    
    const response = await this.openai.jsonCompletion([
      { role: 'system', content: this.buildSystemPrompt(strategy) },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.7,
      maxTokens: 400
    });
    
    return await this.templates.format(response, 'counter_offer');
  }
  
  private async generateAcceptanceEmail(thread: NegotiationThread, price: number): Promise<EmailContent> {
    return {
      subject: `Re: Great! Let's finalize at $${price}`,
      html: `<p>Perfect! I'm ready to move forward at $${price}. How would you like to proceed?</p>`,
      text: `Perfect! I'm ready to move forward at $${price}. How would you like to proceed?`
    };
  }
  
  private async generateFinalOfferEmail(thread: NegotiationThread): Promise<EmailContent> {
    return {
      subject: `Re: Final offer - $${thread.currentOffer}`,
      html: `<p>This is my best and final offer: $${thread.currentOffer}. I'm ready to move forward immediately if this works for you.</p>`,
      text: `This is my best and final offer: $${thread.currentOffer}. I'm ready to move forward immediately if this works for you.`
    };
  }
  
  private async generateNegotiationEmail(
    thread: NegotiationThread,
    newOffer: number,
    analysis: ResponseAnalysis
  ): Promise<EmailContent> {
    return await this.generateCounterEmail(thread, newOffer, analysis);
  }
  
  private async handleRejection(thread: NegotiationThread, analysis: ResponseAnalysis): Promise<void> {
    thread.status = 'rejected';
    await this.updateNegotiationMemory(thread);
    this.emit('negotiation:rejected', thread);
  }
  
  private async handleQuestion(thread: NegotiationThread, analysis: ResponseAnalysis): Promise<void> {
    // Answer questions from seller
    const response = await this.generateQuestionResponse(thread, analysis);
    await this.agentMail.replyToEmail(thread.id, response);
  }
  
  private async generateQuestionResponse(
    thread: NegotiationThread,
    analysis: ResponseAnalysis
  ): Promise<EmailContent> {
    const strategy = this.strategies.get(thread.strategy)!;
    
    const response = await this.openai.jsonCompletion([
      { role: 'system', content: `Answer seller questions professionally using ${strategy.communicationTone} tone.` },
      { role: 'user', content: `Seller question: ${analysis.messageExcerpt}\n\nProvide a helpful, concise answer.` }
    ]);
    
    return await this.templates.format(response, strategy.templateName);
  }
  
  private async handleNegotiation(thread: NegotiationThread, analysis: ResponseAnalysis): Promise<void> {
    // Continue negotiation
    await this.handleCounterOffer(thread, analysis);
  }
  
  private async handleUnclear(thread: NegotiationThread, analysis: ResponseAnalysis): Promise<void> {
    // Request clarification
    const response: EmailContent = {
      subject: `Re: Clarification needed`,
      html: `<p>I'd like to clarify a few points. Could you let me know if my offer of $${thread.currentOffer} works for you, or if you had something different in mind?</p>`,
      text: `I'd like to clarify a few points. Could you let me know if my offer of $${thread.currentOffer} works for you, or if you had something different in mind?`
    };
    
    await this.agentMail.replyToEmail(thread.id, response);
  }
  
  private findThreadByEmail(email: IncomingEmail): NegotiationThread | undefined {
    // Find thread by email headers or content
    if (email.threadId) {
      return this.activeThreads.get(email.threadId);
    }
    
    // Try to find by opportunity ID in headers or content
    for (const thread of this.activeThreads.values()) {
      if (email.from === thread.sellerContact.email) {
        return thread;
      }
    }
    
    return undefined;
  }
  
  private async handleColdInbound(email: IncomingEmail): Promise<void> {
    // Handle unsolicited inbound emails
    console.log('Cold inbound email from:', email.from);
  }
  
  private async scheduleFollowUp(
    thread: NegotiationThread,
    strategy: NegotiationStrategy
  ): Promise<void> {
    const delay = strategy.followUpDelay;
    
    setTimeout(async () => {
      if (thread.status === 'active' && !thread.lastResponseTime) {
        const followUp = await this.generateFollowUpEmail(thread);
        
        await this.agentMail.sendEmail({
          to: thread.sellerContact.email,
          threadId: thread.id,
          ...followUp
        });
        
        thread.rounds.push({
          number: thread.rounds.length + 1,
          timestamp: new Date(),
          type: 'follow_up',
          message: followUp.text,
          status: 'sent'
        });
        
        if (strategy.maxFollowUps > 1 && (thread.followUpCount || 0) < strategy.maxFollowUps) {
          thread.followUpCount = (thread.followUpCount || 0) + 1;
          this.scheduleFollowUp(thread, strategy);
        }
      }
    }, delay);
  }
  
  private async generateFollowUpEmail(thread: NegotiationThread): Promise<EmailContent> {
    const strategy = this.strategies.get(thread.strategy)!;
    
    const response = await this.openai.jsonCompletion([
      { role: 'system', content: `Generate a friendly follow-up email using ${strategy.communicationTone} tone.` },
      { role: 'user', content: `Follow up on offer of $${thread.currentOffer} for opportunity ${thread.opportunityId}` }
    ]);
    
    return await this.templates.format(response, strategy.templateName);
  }
  
  private async storeNegotiationMemory(thread: NegotiationThread): Promise<void> {
    await this.hyperspell.store(`negotiation:${thread.id}`, {
      thread,
      updatedAt: Date.now()
    }, {
      type: 'negotiation',
      expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
    });
  }
  
  private async updateNegotiationMemory(thread: NegotiationThread): Promise<void> {
    await this.storeNegotiationMemory(thread);
  }
  
  private calculateFollowUpDelay(thread: NegotiationThread, strategy: NegotiationStrategy): number {
    return strategy.followUpDelay;
  }
  
  private loadStrategies(): Map<string, NegotiationStrategy> {
    const strategies = new Map<string, NegotiationStrategy>();
    
    // Friendly Local Buyer
    strategies.set('FRIENDLY_LOCAL', {
      name: 'FRIENDLY_LOCAL',
      buyerPersona: 'Friendly neighbor looking for a good deal',
      communicationTone: 'casual, warm, personable',
      approachStyle: 'build rapport, emphasize convenience, mention local pickup',
      tactics: [
        'Mention you live/work nearby',
        'Emphasize quick and easy transaction',
        'Offer cash payment',
        'Be flexible on pickup time',
        'Share a relevant personal detail'
      ],
      openingOffer: 0.7,
      maxOffer: 0.85,
      incrementSize: 0.05,
      urgencyLevel: 'low',
      maxRounds: 4,
      followUpDelay: 24 * 60 * 60 * 1000,
      maxFollowUps: 2,
      creativity: 0.7,
      templateName: 'friendly_casual'
    });
    
    // Professional Buyer
    strategies.set('PROFESSIONAL_BUYER', {
      name: 'PROFESSIONAL_BUYER',
      buyerPersona: 'Professional buyer for business use',
      communicationTone: 'formal, respectful, businesslike',
      approachStyle: 'emphasize bulk potential, quick decision, reliable buyer',
      tactics: [
        'Mention business/professional use',
        'Hint at repeat business potential',
        'Emphasize prompt payment',
        'Request invoice/receipt',
        'Professional email signature'
      ],
      openingOffer: 0.65,
      maxOffer: 0.8,
      incrementSize: 0.05,
      urgencyLevel: 'medium',
      maxRounds: 3,
      followUpDelay: 12 * 60 * 60 * 1000,
      maxFollowUps: 1,
      creativity: 0.5,
      templateName: 'professional'
    });
    
    // Urgent Cash Buyer
    strategies.set('URGENT_CASH', {
      name: 'URGENT_CASH',
      buyerPersona: 'Buyer with immediate need and cash ready',
      communicationTone: 'direct, urgent, decisive',
      approachStyle: 'emphasize immediate purchase, cash in hand, no hassle',
      tactics: [
        'Stress immediate availability',
        'Mention cash in hand',
        'Can pickup within hours',
        'No need for lengthy discussion',
        'Create time pressure'
      ],
      openingOffer: 0.6,
      maxOffer: 0.75,
      incrementSize: 0.075,
      urgencyLevel: 'high',
      maxRounds: 2,
      followUpDelay: 2 * 60 * 60 * 1000,
      maxFollowUps: 1,
      creativity: 0.6,
      templateName: 'urgent'
    });
    
    // Collector/Enthusiast
    strategies.set('COLLECTOR', {
      name: 'COLLECTOR',
      buyerPersona: 'Passionate collector or enthusiast',
      communicationTone: 'knowledgeable, enthusiastic, appreciative',
      approachStyle: 'show expertise, appreciate item value, build connection',
      tactics: [
        'Demonstrate knowledge about item',
        'Mention collection or specific use',
        'Appreciate condition/rarity',
        'Share enthusiasm for the item',
        'Offer to preserve/care for item'
      ],
      openingOffer: 0.75,
      maxOffer: 0.9,
      incrementSize: 0.05,
      urgencyLevel: 'low',
      maxRounds: 5,
      followUpDelay: 48 * 60 * 60 * 1000,
      maxFollowUps: 3,
      creativity: 0.8,
      templateName: 'enthusiast'
    });
    
    return strategies;
  }
  
  private startMonitoring(): void {
    // Monitor for incoming emails
    // This would typically be handled via webhooks from AgentMail
    setInterval(async () => {
      if (this.status === 'active') {
        try {
          const unread = await this.agentMail.getUnreadMessages();
          for (const email of unread) {
            await this.handleIncomingEmail(email as IncomingEmail);
            await this.agentMail.markAsRead(email.id);
          }
        } catch (error) {
          console.error('Error monitoring emails:', error);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

