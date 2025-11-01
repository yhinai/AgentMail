import { HyperspellClient } from './hyperspellClient';
import {
  BuyerProfile,
  ResponseStrategy,
  Interaction,
  NegotiationHistory,
  NegotiationTactic,
} from '../types';
import { Logger } from '../utils/logger';

export class ContextStore {
  private hyperspell: HyperspellClient;

  constructor(hyperspellClient: HyperspellClient) {
    this.hyperspell = hyperspellClient;
  }

  async getBuyerProfile(email: string): Promise<BuyerProfile> {
    Logger.debug(`Getting buyer profile for: ${email}`);

    const history = await this.hyperspell.search({
      query: `buyer:${email}`,
      limit: 100,
    });

    return this.buildProfile(email, history);
  }

  private buildProfile(
    email: string,
    history: any[]
  ): BuyerProfile {
    const negotiations: NegotiationHistory[] = [];
    let totalInteractions = 0;
    let successfulDeals = 0;
    let totalRounds = 0;
    let lastInteraction: Date | undefined;

    // Parse history to extract negotiation data
    for (const doc of history) {
      try {
        const data = JSON.parse(doc.content);
        
        if (data.type === 'negotiation') {
          negotiations.push({
            product: data.product || 'unknown',
            initialAsk: data.initialAsk || 0,
            finalPrice: data.finalPrice,
            rounds: data.rounds || 0,
            tactics: data.tactics || [],
            outcome: data.outcome || 'abandoned',
            timestamp: doc.timestamp || new Date(),
          });
          
          totalRounds += data.rounds || 0;
          
          if (data.outcome === 'closed') {
            successfulDeals++;
          }
        }
        
        if (data.type === 'interaction') {
          totalInteractions++;
          const timestamp = doc.timestamp || new Date();
          if (!lastInteraction || timestamp > lastInteraction) {
            lastInteraction = timestamp;
          }
        }
      } catch (e) {
        // Skip invalid JSON
        totalInteractions++;
      }
    }

    // Determine negotiation style
    const negotiationStyle = this.determineNegotiationStyle(negotiations);

    // Calculate conversion probability
    const conversionProbability =
      totalInteractions > 0 ? successfulDeals / totalInteractions : 0.5;

    // Calculate preferred price range
    const closedDeals = negotiations.filter((n) => n.outcome === 'closed');
    let preferredPriceRange: { min: number; max: number } | undefined;
    if (closedDeals.length > 0) {
      const prices = closedDeals
        .map((n) => n.finalPrice || n.initialAsk)
        .filter((p) => p > 0);
      if (prices.length > 0) {
        preferredPriceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        };
      }
    }

    // Calculate average response time (mock for now)
    const averageResponseTime = totalInteractions > 0 
      ? Math.random() * 300 + 60 // 60-360 seconds
      : undefined;

    return {
      email,
      negotiationHistory: negotiations,
      preferredPriceRange,
      negotiationStyle,
      conversionProbability,
      averageResponseTime,
      lastInteraction,
      totalInteractions,
      successfulDeals,
    };
  }

  private determineNegotiationStyle(
    negotiations: NegotiationHistory[]
  ): 'aggressive' | 'cooperative' | 'price-sensitive' | 'unknown' {
    if (negotiations.length === 0) {
      return 'unknown';
    }

    const avgRounds = negotiations.reduce((sum, n) => sum + n.rounds, 0) / negotiations.length;
    const priceChanges = negotiations.map((n) => {
      if (n.finalPrice && n.initialAsk) {
        return (n.initialAsk - n.finalPrice) / n.initialAsk;
      }
      return 0;
    });
    const avgDiscount = priceChanges.reduce((sum, d) => sum + d, 0) / priceChanges.length;

    // Aggressive: many rounds, high discount requests
    if (avgRounds > 3 && avgDiscount > 0.15) {
      return 'aggressive';
    }

    // Price-sensitive: high discount but fewer rounds (quick decision)
    if (avgDiscount > 0.1 && avgRounds <= 2) {
      return 'price-sensitive';
    }

    // Cooperative: moderate rounds, moderate discount
    if (avgRounds <= 2 && avgDiscount < 0.1) {
      return 'cooperative';
    }

    return 'unknown';
  }

  async getOptimalStrategy(
    productName: string,
    buyerEmail: string
  ): Promise<ResponseStrategy> {
    Logger.debug(`Getting optimal strategy for ${productName} and buyer ${buyerEmail}`);

    const buyerProfile = await this.getBuyerProfile(buyerEmail);
    
    // Get product history
    const productHistory = await this.hyperspell.search({
      query: `product:${productName}`,
      limit: 50,
    });

    // Calculate initial price based on history
    const initialPrice = this.calculateInitialPrice(productHistory, buyerProfile);
    const minAcceptable = this.calculateMinPrice(productHistory, buyerProfile);

    // Determine negotiation rounds
    const negotiationRounds =
      buyerProfile.negotiationStyle === 'aggressive' ? 3 : 2;

    // Select tactics based on buyer profile
    const tactics = this.selectTactics(buyerProfile);

    // Select incentives
    const closingIncentives = this.selectIncentives(buyerProfile);

    // Determine flexibility
    const flexibility = buyerProfile.negotiationStyle === 'cooperative' 
      ? 0.15 
      : buyerProfile.negotiationStyle === 'price-sensitive'
      ? 0.25
      : 0.1;

    // Determine tone
    const tone = buyerProfile.negotiationStyle === 'cooperative'
      ? 'friendly'
      : 'professional';

    return {
      tone,
      pricePoint: initialPrice,
      minAcceptable,
      flexibility,
      incentives: closingIncentives,
      closeAttempt: false,
      negotiationRounds,
      tactics,
    };
  }

  private calculateInitialPrice(
    productHistory: any[],
    buyerProfile: BuyerProfile
  ): number {
    // Extract prices from history
    const prices: number[] = [];
    
    for (const doc of productHistory) {
      try {
        const data = JSON.parse(doc.content);
        if (data.initialPrice || data.price) {
          prices.push(data.initialPrice || data.price);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    // If we have buyer's preferred range, use it as a guide
    if (buyerProfile.preferredPriceRange) {
      const { min, max } = buyerProfile.preferredPriceRange;
      // Start slightly above their max to leave negotiation room
      return max * 1.05;
    }

    // Use average of historical prices, or default
    if (prices.length > 0) {
      const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      return Math.round(avg);
    }

    // Default price (would normally come from product data)
    return 500;
  }

  private calculateMinPrice(
    productHistory: any[],
    buyerProfile: BuyerProfile
  ): number {
    const initialPrice = this.calculateInitialPrice(productHistory, buyerProfile);
    
    // Minimum acceptable is initial price minus max flexibility
    const maxDiscount = buyerProfile.negotiationStyle === 'aggressive' 
      ? 0.2 
      : buyerProfile.negotiationStyle === 'price-sensitive'
      ? 0.15
      : 0.1;

    return initialPrice * (1 - maxDiscount);
  }

  private selectTactics(
    buyerProfile: BuyerProfile
  ): NegotiationTactic[] {
    const tactics: NegotiationTactic[] = [];

    // Scarcity for price-sensitive buyers
    if (buyerProfile.negotiationStyle === 'price-sensitive') {
      tactics.push('scarcity');
    }

    // Urgency for cooperative buyers (they respond well)
    if (buyerProfile.negotiationStyle === 'cooperative') {
      tactics.push('urgency');
    }

    // Value-add for aggressive buyers (give them something extra)
    if (buyerProfile.negotiationStyle === 'aggressive') {
      tactics.push('value-add');
    }

    // Always include social proof
    tactics.push('social-proof');

    return tactics;
  }

  private selectIncentives(
    buyerProfile: BuyerProfile
  ): string[] {
    const incentives: string[] = [];

    // Free shipping is always a good incentive
    incentives.push('Free shipping');

    // Additional incentives based on profile
    if (buyerProfile.negotiationStyle === 'cooperative') {
      incentives.push('Quick response');
    }

    if (buyerProfile.conversionProbability > 0.7) {
      incentives.push('Priority handling');
    }

    return incentives;
  }

  async recordInteraction(interaction: Interaction): Promise<void> {
    Logger.debug(`Recording interaction with ${interaction.buyer}`);

    const data = {
      type: 'interaction',
      buyer: interaction.buyer,
      intent: interaction.intent,
      product: interaction.product,
      timestamp: interaction.timestamp.toISOString(),
      responseTime: interaction.responseTime,
      outcome: interaction.outcome,
    };

    await this.hyperspell.store(
      `buyer:${interaction.buyer}`,
      JSON.stringify(data),
      {
        type: 'interaction',
        buyer: interaction.buyer,
        timestamp: interaction.timestamp,
      }
    );
  }

  async recordNegotiation(
    buyerEmail: string,
    product: string,
    initialAsk: number,
    finalPrice: number | undefined,
    rounds: number,
    tactics: NegotiationTactic[],
    outcome: 'closed' | 'abandoned' | 'expired'
  ): Promise<void> {
    Logger.debug(`Recording negotiation for ${buyerEmail}`);

    const data = {
      type: 'negotiation',
      buyer: buyerEmail,
      product,
      initialAsk,
      finalPrice,
      rounds,
      tactics,
      outcome,
      timestamp: new Date().toISOString(),
    };

    await this.hyperspell.store(
      `buyer:${buyerEmail}`,
      JSON.stringify(data),
      {
        type: 'negotiation',
        buyer: buyerEmail,
        product,
        timestamp: new Date(),
      }
    );

    // Also store product-level data
    await this.hyperspell.store(
      `product:${product}`,
      JSON.stringify({
        type: 'price_history',
        product,
        initialPrice: initialAsk,
        finalPrice,
        timestamp: new Date().toISOString(),
      }),
      {
        type: 'price_history',
        product,
        timestamp: new Date(),
      }
    );
  }
}

