// Deal Analyzer Agent - ML-based deal analysis with profit/risk calculations
import { OpenAIIntegration } from '../integrations/OpenAIIntegration';
import { Agent } from '../core/agents/AgentRegistry';
import type {
  EnrichedOpportunity,
  DealAnalysis,
  SellerProfile
} from '../types';

interface DealAnalyzerConfig {
  openai: OpenAIIntegration;
}

export class DealAnalyzerAgent implements Agent {
  public readonly name = 'deal-analyzer';
  public status: 'idle' | 'active' | 'error' | 'stopped' = 'idle';
  
  private openai: OpenAIIntegration;
  
  constructor(config: DealAnalyzerConfig) {
    this.openai = config.openai;
  }
  
  async start(): Promise<void> {
    this.status = 'active';
  }
  
  async stop(): Promise<void> {
    this.status = 'stopped';
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const health = await this.openai.healthCheck();
      return health.healthy;
    } catch {
      return false;
    }
  }
  
  async analyzeDeal(opportunity: EnrichedOpportunity): Promise<DealAnalysis> {
    this.status = 'active';
    
    try {
      // Extract key metrics
      const profitMargin = opportunity.profitAnalysis?.profitMargin || 0;
      const riskScore = opportunity.riskAssessment?.score || 0.5;
      const demandScore = opportunity.marketData?.demandScore || 0.5;
      
      // Analyze seller profile
      const sellerProfile = await this.analyzeSellerProfile(opportunity);
      
      // Generate recommendation using AI
      const recommendation = await this.generateRecommendation(opportunity, {
        profitMargin,
        riskScore,
        demandScore,
        sellerProfile
      });
      
      // Calculate max acceptable price
      const maxPrice = this.calculateMaxPrice(opportunity, recommendation);
      
      const analysis: DealAnalysis = {
        opportunity,
        recommendation: {
          action: recommendation.action,
          confidence: recommendation.confidence,
          maxPrice,
          reasoning: recommendation.reasoning
        },
        profitMargin,
        sellerProfile
      };
      
      this.status = 'idle';
      return analysis;
    } catch (error) {
      this.status = 'error';
      console.error('Deal analysis error:', error);
      throw error;
    }
  }
  
  private async analyzeSellerProfile(opportunity: EnrichedOpportunity): Promise<SellerProfile | undefined> {
    // Analyze seller characteristics
    const seller = opportunity.seller;
    
    // Determine seller type based on available data
    const sellerType: 'business' | 'individual' = 
      seller.name?.includes('LLC') || seller.name?.includes('Inc') || seller.name?.includes('Corp')
        ? 'business'
        : 'individual';
    
    return {
      type: sellerType,
      responseRate: seller.responseTime ? this.parseResponseTime(seller.responseTime) : undefined,
      averageDiscount: undefined,
      preferredCommunicationStyle: undefined
    };
  }
  
  private parseResponseTime(responseTime: string): number {
    // Parse response time like "responds within hours" to a numeric rate
    const lower = responseTime.toLowerCase();
    if (lower.includes('hour')) return 0.8;
    if (lower.includes('day')) return 0.6;
    if (lower.includes('week')) return 0.3;
    return 0.5;
  }
  
  private async generateRecommendation(
    opportunity: EnrichedOpportunity,
    metrics: {
      profitMargin: number;
      riskScore: number;
      demandScore: number;
      sellerProfile?: SellerProfile;
    }
  ): Promise<{
    action: 'BUY' | 'NEGOTIATE' | 'PASS';
    confidence: number;
    reasoning: string[];
  }> {
    const prompt = `Analyze this marketplace opportunity and provide a recommendation:

Item: ${opportunity.title}
Current Price: $${opportunity.price}
Estimated Market Price: $${opportunity.marketData?.averagePrice || opportunity.price * 1.3}
Profit Margin: ${metrics.profitMargin.toFixed(1)}%
Risk Score: ${(metrics.riskScore * 100).toFixed(1)}/100
Demand Score: ${(metrics.demandScore * 100).toFixed(1)}/100
Platform: ${opportunity.platform}
Seller Type: ${metrics.sellerProfile?.type || 'unknown'}

Provide a recommendation (BUY, NEGOTIATE, or PASS) with:
1. Confidence level (0-1)
2. Reasoning (2-3 key points)

Output as JSON with: action, confidence, reasoning (array of strings).`;
    
    try {
      const result = await this.openai.jsonCompletion([
        {
          role: 'system',
          content: 'You are an expert deal analyzer for e-commerce arbitrage. Analyze opportunities objectively and provide actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]);
      
      return {
        action: result.action || (metrics.profitMargin > 30 && metrics.riskScore < 0.4 ? 'BUY' : metrics.profitMargin > 20 ? 'NEGOTIATE' : 'PASS'),
        confidence: result.confidence || this.calculateConfidence(metrics),
        reasoning: result.reasoning || this.generateDefaultReasoning(metrics)
      };
    } catch (error) {
      // Fallback to rule-based recommendation
      return this.generateRuleBasedRecommendation(metrics);
    }
  }
  
  private generateRuleBasedRecommendation(metrics: {
    profitMargin: number;
    riskScore: number;
    demandScore: number;
  }): {
    action: 'BUY' | 'NEGOTIATE' | 'PASS';
    confidence: number;
    reasoning: string[];
  } {
    let action: 'BUY' | 'NEGOTIATE' | 'PASS';
    let confidence = 0.7;
    const reasoning: string[] = [];
    
    if (metrics.profitMargin > 40 && metrics.riskScore < 0.3 && metrics.demandScore > 0.6) {
      action = 'BUY';
      confidence = 0.9;
      reasoning.push('High profit margin with low risk');
      reasoning.push('Strong market demand');
    } else if (metrics.profitMargin > 25 && metrics.riskScore < 0.5) {
      action = 'NEGOTIATE';
      confidence = 0.75;
      reasoning.push('Good profit potential');
      reasoning.push('Negotiation could improve margins');
    } else if (metrics.profitMargin > 15 && metrics.riskScore < 0.6) {
      action = 'NEGOTIATE';
      confidence = 0.6;
      reasoning.push('Moderate profit opportunity');
    } else {
      action = 'PASS';
      confidence = 0.8;
      reasoning.push('Profit margin too low or risk too high');
    }
    
    return { action, confidence, reasoning };
  }
  
  private calculateConfidence(metrics: {
    profitMargin: number;
    riskScore: number;
    demandScore: number;
  }): number {
    // Weighted confidence calculation
    const profitScore = Math.min(metrics.profitMargin / 50, 1);
    const riskScore = 1 - metrics.riskScore;
    const demandScore = metrics.demandScore;
    
    return (profitScore * 0.4 + riskScore * 0.3 + demandScore * 0.3);
  }
  
  private generateDefaultReasoning(metrics: {
    profitMargin: number;
    riskScore: number;
    demandScore: number;
  }): string[] {
    const reasoning: string[] = [];
    
    if (metrics.profitMargin > 30) {
      reasoning.push(`Excellent profit margin of ${metrics.profitMargin.toFixed(1)}%`);
    } else if (metrics.profitMargin > 20) {
      reasoning.push(`Good profit margin of ${metrics.profitMargin.toFixed(1)}%`);
    }
    
    if (metrics.riskScore < 0.3) {
      reasoning.push('Low risk transaction');
    } else if (metrics.riskScore > 0.6) {
      reasoning.push('Higher risk factors present');
    }
    
    if (metrics.demandScore > 0.7) {
      reasoning.push('Strong market demand');
    }
    
    return reasoning;
  }
  
  private calculateMaxPrice(
    opportunity: EnrichedOpportunity,
    recommendation: {
      action: 'BUY' | 'NEGOTIATE' | 'PASS';
      confidence: number;
    }
  ): number {
    const marketPrice = opportunity.marketData?.averagePrice || opportunity.price * 1.3;
    const platformFees = this.calculatePlatformFees(marketPrice, opportunity.platform);
    const minProfitRequired = opportunity.price * 0.15; // 15% minimum profit
    
    // Max price where we still make minimum profit after fees
    const maxPrice = marketPrice - platformFees - minProfitRequired;
    
    // Adjust based on recommendation
    if (recommendation.action === 'BUY') {
      // More flexible on price for strong buys
      return Math.max(maxPrice, opportunity.price * 1.15);
    } else if (recommendation.action === 'NEGOTIATE') {
      // Target lower price for negotiations
      return Math.max(maxPrice * 0.9, opportunity.price * 1.05);
    } else {
      return opportunity.price; // Don't pay more than asking for PASS
    }
  }
  
  private calculatePlatformFees(price: number, platform: string): number {
    const feeRates: Record<string, number> = {
      'ebay': 0.13,
      'mercari': 0.10,
      'facebook': 0.05,
      'craigslist': 0,
      'offerup': 0.12
    };
    
    return price * (feeRates[platform] || 0.10);
  }
}

