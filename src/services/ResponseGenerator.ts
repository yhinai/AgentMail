/**
 * Response Generator Service
 * AI-powered email analysis and response generation using OpenAI GPT-4
 */

import OpenAI from 'openai';

export interface EmailAnalysis {
  intent: 'inquiry' | 'offer' | 'negotiation' | 'closing' | 'complaint' | 'other';
  product?: string;
  priceOffer?: number;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keyPoints: string[];
}

export interface ResponseContext {
  buyerEmail: string;
  buyerName?: string;
  product: string;
  productCost: number;
  targetPrice: number;
  currentPrice: number;
  negotiationHistory?: Array<{
    price: number;
    from: 'buyer' | 'seller';
    timestamp: Date;
  }>;
  buyerProfile?: {
    priceSensitivity: 'low' | 'medium' | 'high';
    negotiationStyle: 'aggressive' | 'cooperative' | 'passive';
    communicationPreference: 'brief' | 'detailed' | 'friendly';
  };
  marketData?: {
    average: number;
    optimal: number;
    demand: 'low' | 'medium' | 'high';
  };
}

export interface GeneratedResponse {
  subject: string;
  body: string;
  html?: string;
  tone: 'friendly' | 'professional' | 'urgent';
  strategy: string;
  suggestedPrice?: number;
  shouldSend: boolean;
  reasoning: string;
}

export class ResponseGenerator {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4';

    if (!key) {
      throw new Error('OpenAI API key not configured');
    }

    this.openai = new OpenAI({ apiKey: key });
  }

  // ============================================
  // EMAIL ANALYSIS
  // ============================================

  /**
   * Analyze incoming email using GPT-4
   */
  async analyzeEmail(subject: string, body: string, from: string): Promise<EmailAnalysis> {
    console.log(`🔍 Analyzing email from ${from}...`);

    try {
      const prompt = `Analyze this email and extract structured information:

FROM: ${from}
SUBJECT: ${subject}
BODY: ${body}

Extract:
1. Intent: inquiry, offer, negotiation, closing, complaint, or other
2. Product mentioned (if any)
3. Price offer (if any, extract number only)
4. Urgency level: low, medium, or high
5. Sentiment: positive, neutral, or negative
6. Confidence score (0-1)
7. Key points (array of strings)

Return ONLY valid JSON in this exact format:
{
  "intent": "inquiry|offer|negotiation|closing|complaint|other",
  "product": "product name or null",
  "priceOffer": number or null,
  "urgency": "low|medium|high",
  "sentiment": "positive|neutral|negative",
  "confidence": 0.95,
  "keyPoints": ["point1", "point2"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert email analyzer for an e-commerce business. Extract structured information from emails accurately.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      console.log(`✅ Email analyzed:`, analysis);

      return analysis as EmailAnalysis;
    } catch (error: any) {
      console.error('❌ Email analysis failed:', error.message);

      // Fallback analysis
      return {
        intent: 'other',
        urgency: 'medium',
        sentiment: 'neutral',
        confidence: 0.5,
        keyPoints: ['Unable to analyze email'],
      };
    }
  }

  // ============================================
  // RESPONSE GENERATION
  // ============================================

  /**
   * Generate AI-powered email response
   */
  async generateResponse(
    analysis: EmailAnalysis,
    context: ResponseContext,
    originalEmail: { subject: string; body: string; from: string }
  ): Promise<GeneratedResponse> {
    console.log(`✍️  Generating response for ${analysis.intent} email...`);

    try {
      const prompt = this.buildResponsePrompt(analysis, context, originalEmail);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(context),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const generated = JSON.parse(response.choices[0].message.content || '{}');
      console.log(`✅ Response generated`);

      return generated as GeneratedResponse;
    } catch (error: any) {
      console.error('❌ Response generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Build the response generation prompt
   */
  private buildResponsePrompt(
    analysis: EmailAnalysis,
    context: ResponseContext,
    originalEmail: { subject: string; body: string; from: string }
  ): string {
    const negotiationHistory = context.negotiationHistory
      ? context.negotiationHistory.map(h => `${h.from}: $${h.price}`).join(', ')
      : 'No history';

    return `Generate a professional email response for this e-commerce negotiation:

ORIGINAL EMAIL:
From: ${originalEmail.from}
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

EMAIL ANALYSIS:
Intent: ${analysis.intent}
Urgency: ${analysis.urgency}
Sentiment: ${analysis.sentiment}
Key Points: ${analysis.keyPoints.join(', ')}

CONTEXT:
Product: ${context.product}
Product Cost: $${context.productCost}
Current Price: $${context.currentPrice}
Target Price: $${context.targetPrice}
Buyer Offer: ${analysis.priceOffer ? `$${analysis.priceOffer}` : 'Not specified'}
Negotiation History: ${negotiationHistory}

${context.buyerProfile ? `
BUYER PROFILE:
Price Sensitivity: ${context.buyerProfile.priceSensitivity}
Negotiation Style: ${context.buyerProfile.negotiationStyle}
Communication Preference: ${context.buyerProfile.communicationPreference}
` : ''}

${context.marketData ? `
MARKET DATA:
Market Average: $${context.marketData.average}
Optimal Price: $${context.marketData.optimal}
Demand: ${context.marketData.demand}
` : ''}

INSTRUCTIONS:
1. Respond appropriately to the buyer's intent
2. Be friendly but professional
3. If they made an offer, evaluate it:
   - Accept if >= target price
   - Counter if reasonable (>= cost + 20% margin)
   - Politely decline if too low
4. Use buyer's communication preference
5. Create urgency if demand is high
6. Include product benefits if inquiry

Return ONLY valid JSON:
{
  "subject": "Re: [original subject]",
  "body": "Full email body text",
  "html": "HTML version (optional)",
  "tone": "friendly|professional|urgent",
  "strategy": "Brief explanation of approach",
  "suggestedPrice": number or null,
  "shouldSend": true|false,
  "reasoning": "Why this response was chosen"
}`;
  }

  /**
   * Get system prompt based on context
   */
  private getSystemPrompt(context: ResponseContext): string {
    return `You are an expert AI sales agent for ProfitPilot, an autonomous e-commerce platform.

Your role:
- Negotiate effectively while maximizing profit
- Build rapport with buyers
- Close deals efficiently
- Never sell below cost + 20% minimum margin
- Adapt tone to buyer's communication style
- Use market data to justify pricing

Style guidelines:
- Be conversational and human-like
- Show enthusiasm about the product
- Address concerns proactively
- Create win-win scenarios
- Use social proof when available

Never:
- Be pushy or aggressive
- Reveal internal costs
- Make false claims
- Use overly salesy language
- Send responses that could harm the business`;
  }

  // ============================================
  // TEMPLATE-BASED RESPONSES (Fallback)
  // ============================================

  /**
   * Generate template-based response (fast fallback)
   */
  generateTemplateResponse(
    analysis: EmailAnalysis,
    context: ResponseContext
  ): GeneratedResponse {
    console.log(`📝 Generating template response for ${analysis.intent}...`);

    const templates = {
      inquiry: this.getInquiryTemplate(context),
      offer: this.getOfferTemplate(analysis, context),
      negotiation: this.getNegotiationTemplate(analysis, context),
      closing: this.getClosingTemplate(context),
      complaint: this.getComplaintTemplate(context),
      other: this.getGenericTemplate(context),
    };

    return templates[analysis.intent] || templates.other;
  }

  private getInquiryTemplate(context: ResponseContext): GeneratedResponse {
    return {
      subject: `Re: ${context.product} - Available Now!`,
      body: `Hi there!

Thanks for your interest in the ${context.product}!

This item is in excellent condition and ready to ship. The current price is $${context.currentPrice}.

Key features:
• High quality and well-maintained
• Fast shipping available
• Secure payment options

I'd be happy to answer any questions you have. Feel free to make an offer if you're interested!

Best regards,
ProfitPilot Sales Team`,
      tone: 'friendly',
      strategy: 'Engage and encourage offer',
      shouldSend: true,
      reasoning: 'Standard inquiry response to build interest',
    };
  }

  private getOfferTemplate(analysis: EmailAnalysis, context: ResponseContext): GeneratedResponse {
    const offer = analysis.priceOffer || 0;
    const minAcceptable = context.productCost * 1.2;

    if (offer >= context.targetPrice) {
      return {
        subject: `Re: Your offer - ACCEPTED!`,
        body: `Great news! I'm happy to accept your offer of $${offer} for the ${context.product}.

Let's move forward with the purchase. Please reply with your preferred payment method and shipping address.

Looking forward to completing this transaction!

Best regards,
ProfitPilot Sales Team`,
        tone: 'professional',
        strategy: 'Accept offer',
        suggestedPrice: offer,
        shouldSend: true,
        reasoning: 'Offer meets or exceeds target price',
      };
    } else if (offer >= minAcceptable) {
      const counterPrice = Math.round((offer + context.targetPrice) / 2);
      return {
        subject: `Re: Your offer - Counter Proposal`,
        body: `Thanks for your offer of $${offer} for the ${context.product}.

I appreciate your interest! Based on the item's condition and current market value, I could meet you at $${counterPrice}.

This is a fair price considering the quality and features. Let me know if this works for you!

Best regards,
ProfitPilot Sales Team`,
        tone: 'friendly',
        strategy: 'Counter offer',
        suggestedPrice: counterPrice,
        shouldSend: true,
        reasoning: 'Offer is reasonable but below target, countering',
      };
    } else {
      return {
        subject: `Re: Your offer - Unable to Accept`,
        body: `Thank you for your interest in the ${context.product}.

Unfortunately, I cannot accept an offer of $${offer} as it's below my minimum price for this quality item.

The lowest I can go is $${minAcceptable}. This reflects the true value and condition of the product.

Let me know if you'd like to reconsider!

Best regards,
ProfitPilot Sales Team`,
        tone: 'professional',
        strategy: 'Decline and set minimum',
        suggestedPrice: minAcceptable,
        shouldSend: true,
        reasoning: 'Offer too low, setting minimum acceptable price',
      };
    }
  }

  private getNegotiationTemplate(analysis: EmailAnalysis, context: ResponseContext): GeneratedResponse {
    return {
      subject: `Re: ${context.product} - Let's Make a Deal`,
      body: `I understand you're looking for the best price on the ${context.product}.

Current asking price: $${context.currentPrice}

I'm willing to work with you to find a fair price. What's your best offer?

Best regards,
ProfitPilot Sales Team`,
      tone: 'professional',
      strategy: 'Encourage buyer to make offer',
      shouldSend: true,
      reasoning: 'Continue negotiation dialogue',
    };
  }

  private getClosingTemplate(context: ResponseContext): GeneratedResponse {
    return {
      subject: `Re: ${context.product} - Ready to Complete Purchase`,
      body: `Perfect! Let's finalize this purchase of the ${context.product} for $${context.currentPrice}.

Next steps:
1. Confirm your shipping address
2. Choose payment method
3. I'll ship within 24 hours

Looking forward to your response!

Best regards,
ProfitPilot Sales Team`,
      tone: 'professional',
      strategy: 'Guide to completion',
      shouldSend: true,
      reasoning: 'Buyer ready to close, guide next steps',
    };
  }

  private getComplaintTemplate(context: ResponseContext): GeneratedResponse {
    return {
      subject: `Re: Your Concern - We're Here to Help`,
      body: `I sincerely apologize for any issues you've experienced.

Your satisfaction is my top priority. Please let me know:
1. What specifically went wrong?
2. How can I make this right?

I'm committed to resolving this quickly and fairly.

Best regards,
ProfitPilot Sales Team`,
      tone: 'professional',
      strategy: 'Empathy and resolution',
      shouldSend: false,
      reasoning: 'Complaint requires manual review before sending',
    };
  }

  private getGenericTemplate(context: ResponseContext): GeneratedResponse {
    return {
      subject: `Re: ${context.product}`,
      body: `Thank you for your message regarding the ${context.product}.

I'm here to help! Could you provide more details about what you're looking for?

Best regards,
ProfitPilot Sales Team`,
      tone: 'friendly',
      strategy: 'Request clarification',
      shouldSend: false,
      reasoning: 'Unclear intent, needs manual review',
    };
  }
}
