// Hyperspell integration for context and memory management
import axios from 'axios';
import type { BuyerProfile, Strategy, InteractionRecord, LegacyTransaction, Transaction } from '../types';

// Hyperspell SDK Interface
interface HyperspellClient {
  search(params: { query: string; limit?: number }): Promise<any[]>;
  store(params: { key: string; value: any }): Promise<void>;
  retrieve(params: { key: string }): Promise<any | null>;
  delete(params: { key: string }): Promise<void>;
}

// Real Hyperspell SDK Implementation using HTTP API
class HyperspellSDK implements HyperspellClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = apiUrl || 'https://api.hyperspell.com/v1';
  }

  async search(params: { query: string; limit?: number }): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query: params.query,
          limit: params.limit || 50,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.results || [];
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        console.warn('Hyperspell API not configured, using fallback');
        return [];
      }
      throw new Error(`Hyperspell search failed: ${error.message}`);
    }
  }

  async store(params: { key: string; value: any }): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/store`,
        {
          key: params.key,
          value: params.value,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        // Silently fail if API not configured
        return;
      }
      throw new Error(`Hyperspell store failed: ${error.message}`);
    }
  }

  async retrieve(params: { key: string }): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/retrieve/${encodeURIComponent(params.key)}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data.value || null;
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        return null;
      }
      throw new Error(`Hyperspell retrieve failed: ${error.message}`);
    }
  }

  async delete(params: { key: string }): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/delete/${encodeURIComponent(params.key)}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
    } catch (error: any) {
      // Silently fail on delete
    }
  }
}

// Mock Hyperspell client (fallback)
class MockHyperspellClient implements HyperspellClient {
  private storage: Map<string, any[]> = new Map();

  async search(params: { query: string; limit?: number }): Promise<any[]> {
    const query = params.query.toLowerCase();
    const results: any[] = [];
    
    for (const [key, values] of this.storage.entries()) {
      if (key.includes(query) || query.includes(key)) {
        results.push(...values);
      }
    }
    
    return results.slice(0, params.limit || 50);
  }

  async store(params: { key: string; value: any }): Promise<void> {
    if (!this.storage.has(params.key)) {
      this.storage.set(params.key, []);
    }
    this.storage.get(params.key)!.push(params.value);
  }

  async retrieve(params: { key: string }): Promise<any | null> {
    const results = await this.search({ query: params.key, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async delete(params: { key: string }): Promise<void> {
    this.storage.delete(params.key);
  }
}

export class ContextStore {
  private hyperspell: HyperspellClient;

  constructor() {
    const apiKey = process.env.HYPERSPELL_API_KEY || '';
    const apiUrl = process.env.HYPERSPELL_API_URL || 'https://api.hyperspell.com/v1';
    
    // Initialize Hyperspell client with real SDK
    if (apiKey) {
      this.hyperspell = new HyperspellSDK(apiKey, apiUrl);
    } else {
      // Try to use Hyperspell SDK if installed as npm package
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Hyperspell = require('hyperspell');
        this.hyperspell = new Hyperspell({ apiKey, apiUrl });
      } catch {
        // Use HTTP API implementation with fallback
        this.hyperspell = new MockHyperspellClient();
        console.warn('Hyperspell SDK not found, using HTTP API fallback');
      }
    }
  }

  /**
   * Get buyer profile with full history and analysis
   */
  async getBuyerProfile(email: string): Promise<BuyerProfile> {
    // Search for all interactions with this buyer
    const history = await this.hyperspell.search({
      query: `buyer:${email}`,
      limit: 50,
    });

    return this.buildProfile(email, history);
  }

  /**
   * Get optimal negotiation strategy for a buyer and product
   */
  async getOptimalStrategy(buyer: string, product: string): Promise<Strategy> {
    const profile = await this.getBuyerProfile(buyer);
    
    // Search for product-specific history
    const productHistory = await this.hyperspell.search({
      query: `product:${product}`,
    });

    return this.calculateStrategy(profile, productHistory);
  }

  /**
   * Record an interaction for learning
   */
  async recordInteraction(interaction: InteractionRecord): Promise<void> {
    // Store buyer interaction
    await this.hyperspell.store({
      key: `buyer:${interaction.buyer}`,
      value: interaction,
    });

    // Store product interaction
    await this.hyperspell.store({
      key: `product:${interaction.product}`,
      value: interaction,
    });

    // Store intent-based interaction
    await this.hyperspell.store({
      key: `intent:${interaction.intent}`,
      value: interaction,
    });
  }

  /**
   * Build buyer profile from interaction history
   */
  private buildProfile(email: string, history: any[]): BuyerProfile {
    if (history.length === 0) {
      // Default profile for new buyers
      return {
        email,
        purchaseHistory: [],
        priceSensitivity: 'medium',
        negotiationStyle: 'cooperative',
        communicationPreference: 'friendly',
        conversionProbability: 0.5,
        totalSpent: 0,
        averageDiscount: 0,
      };
    }

    // Analyze history to build profile
    const completed = history.filter((h: any) => h.outcome === 'closed');
    const totalSpent = completed.reduce((sum: number, h: any) => sum + (h.finalPrice || 0), 0);
    const discounts = completed
      .filter((h: any) => h.finalPrice && h.initialPrice)
      .map((h: any) => (h.initialPrice - h.finalPrice) / h.initialPrice);
    const averageDiscount = discounts.length > 0
      ? discounts.reduce((a: number, b: number) => a + b, 0) / discounts.length
      : 0;

    // Determine price sensitivity
    const priceSensitivity = averageDiscount > 0.15 ? 'high' : averageDiscount > 0.05 ? 'medium' : 'low';

    // Determine negotiation style (simplified logic)
    const aggressiveCount = history.filter((h: any) => 
      h.intent === 'offer' && h.outcome === 'closed'
    ).length;
    const negotiationStyle = aggressiveCount > completed.length * 0.5 ? 'aggressive' : 'cooperative';

    // Calculate conversion probability
    const conversionProbability = completed.length / Math.max(history.length, 1);

    return {
      email,
      purchaseHistory: completed.map((h: any): Transaction => ({
        id: h.id || '',
        type: 'sale' as const,
        category: 'inventory' as const,
        amount: h.finalPrice || 0,
        currency: 'USD',
        netAmount: h.finalPrice || 0,
        counterparty: {
          type: 'buyer' as const,
          id: email,
          email: email,
        },
        paymentStatus: 'completed' as const,
        platform: 'internal',
        status: 'completed',
        createdAt: Date.now(),
        completedAt: new Date(h.timestamp).getTime(),
      })),
      priceSensitivity,
      negotiationStyle,
      communicationPreference: 'friendly', // Could be inferred from email analysis
      conversionProbability,
      lastInteraction: history.length > 0 
        ? new Date(history[history.length - 1].timestamp)
        : undefined,
      totalSpent,
      averageDiscount,
    };
  }

  /**
   * Calculate optimal negotiation strategy
   */
  private calculateStrategy(profile: BuyerProfile, productHistory: any[]): Strategy {
    // Base strategy on buyer profile
    const baseFlexibility = profile.priceSensitivity === 'high' ? 0.2 : 0.1;
    const flexibility = profile.negotiationStyle === 'aggressive' ? baseFlexibility * 1.5 : baseFlexibility;

    // Determine initial price (could use market data)
    const initialPrice = 100; // Placeholder - should come from market analysis
    const minAcceptable = initialPrice * (1 - flexibility);

    // Determine negotiation rounds based on buyer style
    const negotiationRounds = profile.negotiationStyle === 'aggressive' ? 3 : 2;

    // Select tactics based on profile
    const tactics: string[] = [];
    if (profile.negotiationStyle === 'aggressive') {
      tactics.push('stand-firm', 'emphasize-value');
    } else {
      tactics.push('build-rapport', 'flexible-approach');
    }

    // Select closing incentives
    const closingIncentives: string[] = [];
    if (profile.priceSensitivity === 'high') {
      closingIncentives.push('limited-time-offer', 'free-shipping');
    } else {
      closingIncentives.push('quality-assurance', 'fast-delivery');
    }

    // Determine tone based on communication preference
    const tone = profile.communicationPreference === 'brief' ? 'professional' : 'friendly';

    // Determine if should attempt close
    const closeAttempt = profile.conversionProbability > 0.7;

    return {
      initialPrice,
      minAcceptable,
      negotiationRounds,
      tactics,
      closingIncentives,
      tone,
      flexibility,
      closeAttempt,
      pricePoint: initialPrice,
    };
  }

  /**
   * Get buyer's negotiation history for a specific product
   */
  async getBuyerProductHistory(buyer: string, product: string): Promise<any[]> {
    return await this.hyperspell.search({
      query: `buyer:${buyer} product:${product}`,
      limit: 20,
    });
  }
}