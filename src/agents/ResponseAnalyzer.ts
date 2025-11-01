// Response Analyzer - AI-powered response analysis
import { OpenAIIntegration } from '../integrations/OpenAIIntegration';
import type { IncomingEmail, NegotiationThread, ResponseAnalysis } from '../types';

export class ResponseAnalyzer {
  constructor(private openai: OpenAIIntegration) {}
  
  async analyze(email: IncomingEmail, thread: NegotiationThread): Promise<ResponseAnalysis> {
    const prompt = `Analyze this negotiation response:
    
    Original listing price: $${this.getOriginalPrice(thread)}
    Our last offer: $${thread.currentOffer}
    Email subject: ${email.subject}
    Email body: ${email.body}
    
    Extract and determine:
    1. Intent: ACCEPT, COUNTER, REJECT, QUESTION, NEGOTIATE, UNCLEAR
    2. If counter-offer, extract exact price
    3. Sentiment: positive, neutral, negative
    4. Key concerns or objections mentioned
    5. Urgency indicators
    6. Decision factors they mention
    7. Their negotiation style
    
    Output as JSON with: intent, price (if counter), sentiment, concerns (array), urgency, factors (array), style, confidence.`;
    
    try {
      const analysis = await this.openai.jsonCompletion([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 300
      });
      
      return {
        intent: analysis.intent || 'UNCLEAR',
        extractedPrice: analysis.price || undefined,
        sentiment: analysis.sentiment || 'neutral',
        extractedConcerns: analysis.concerns || [],
        urgencyLevel: analysis.urgency || 'medium',
        decisionFactors: analysis.factors || [],
        negotiationStyle: analysis.style || 'unknown',
        confidence: analysis.confidence || 0.7,
        messageExcerpt: email.body.substring(0, 200),
        product: undefined,
        price: analysis.price,
        urgency: analysis.urgency === 'high' ? 'high' : analysis.urgency === 'low' ? 'low' : 'medium'
      };
    } catch (error) {
      // Fallback to basic analysis
      return this.basicAnalysis(email, thread);
    }
  }
  
  private basicAnalysis(email: IncomingEmail, thread: NegotiationThread): ResponseAnalysis {
    const body = email.body.toLowerCase();
    
    let intent: ResponseAnalysis['intent'] = 'UNCLEAR';
    let extractedPrice: number | undefined;
    
    // Extract price
    const priceMatch = body.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
    }
    
    // Determine intent
    if (body.includes('yes') || body.includes('accept') || body.includes('deal') || body.includes('sounds good')) {
      intent = 'ACCEPT';
    } else if (priceMatch && extractedPrice) {
      intent = 'COUNTER';
    } else if (body.includes('no') || body.includes('not interested') || body.includes('decline')) {
      intent = 'REJECT';
    } else if (body.includes('?') || body.includes('question')) {
      intent = 'QUESTION';
    } else if (body.includes('negotiate') || body.includes('counter')) {
      intent = 'NEGOTIATE';
    }
    
    return {
      intent,
      extractedPrice,
      sentiment: body.includes('thank') || body.includes('appreciate') ? 'positive' : 
                 body.includes('sorry') || body.includes('unfortunately') ? 'negative' : 'neutral',
      extractedConcerns: [],
      urgencyLevel: 'medium',
      decisionFactors: [],
      negotiationStyle: 'unknown',
      confidence: 0.6,
      messageExcerpt: email.body.substring(0, 200),
      urgency: 'medium'
    };
  }
  
  private getOriginalPrice(thread: NegotiationThread): number {
    // Get original price from first round or opportunity
    if (thread.rounds.length > 0 && thread.rounds[0].ourOffer) {
      // Reverse calculate from offer percentage (approximate)
      return thread.rounds[0].ourOffer / 0.7; // Assuming 70% initial offer
    }
    return thread.currentOffer;
  }
}

