import axios from 'axios';
import { MarketData, Product } from '../types';
import { Logger } from '../utils/logger';
import { retry } from '../utils/retry';

export class MarketAgent {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeProduct(productName: string): Promise<MarketData> {
    Logger.info(`Analyzing market for: ${productName}`);

    try {
      const query = `What is the current average selling price for ${productName} on online marketplaces like eBay, Facebook Marketplace, and Craigslist in 2024? Include price range and demand level.`;

      const response = await retry(
        () => this.queryPerplexity(query),
        {
          maxAttempts: 3,
          delay: 1000,
          exponentialBackoff: true,
          maxDelay: 10000,
        }
      );

      return this.extractMarketData(response, productName);
    } catch (error) {
      Logger.error('Error analyzing product market', error);
      // Return default market data
      return this.getDefaultMarketData();
    }
  }

  private async queryPerplexity(query: string): Promise<string> {
    // In demo mode, return mock data
    if (process.env.DEMO_MODE === 'true') {
      Logger.debug('[DEMO] Using mock Perplexity response');
      return this.getMockPerplexityResponse();
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
          temperature: 0.2,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      Logger.error('Perplexity API error', error);
      throw error;
    }
  }

  private extractMarketData(response: string, productName: string): MarketData {
    // Extract prices from response using regex
    const priceRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    const prices: number[] = [];
    let match;

    while ((match = priceRegex.exec(response)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 0 && price < 1000000) {
        // Reasonable price range
        prices.push(price);
      }
    }

    // If no prices found, try to extract from context
    if (prices.length === 0) {
      // Look for price ranges like "$200-$300"
      const rangeRegex = /\$(\d+)[-\s]+(\d+)/g;
      while ((match = rangeRegex.exec(response)) !== null) {
        prices.push(
          parseFloat(match[1]),
          parseFloat(match[2])
        );
      }
    }

    // Default to mock prices if still nothing found
    if (prices.length === 0) {
      Logger.warn('No prices extracted, using default market data');
      return this.getDefaultMarketData();
    }

    // Calculate statistics
    const sorted = [...prices].sort((a, b) => a - b);
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Calculate optimal price (slightly above median for profit margin)
    const optimal = median * 1.15;

    // Estimate demand from keywords in response
    const demandKeywords = [
      'high demand',
      'popular',
      'selling fast',
      'quick sale',
      'sought after',
    ];
    const lowDemandKeywords = ['slow', 'difficult', 'niche', 'rare'];
    const responseLower = response.toLowerCase();
    const hasHighDemand = demandKeywords.some((kw) =>
      responseLower.includes(kw)
    );
    const hasLowDemand = lowDemandKeywords.some((kw) =>
      responseLower.includes(kw)
    );

    let demand = 0.5; // Default medium demand
    if (hasHighDemand) demand = 0.8;
    if (hasLowDemand) demand = 0.3;

    // Determine trend (simple heuristic)
    const trendKeywords = {
      increasing: ['rising', 'increasing', 'going up', 'higher'],
      decreasing: ['dropping', 'decreasing', 'going down', 'lower'],
    };
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const responseLowerTrend = response.toLowerCase();
    if (trendKeywords.increasing.some((kw) => responseLowerTrend.includes(kw))) {
      trend = 'increasing';
    } else if (
      trendKeywords.decreasing.some((kw) => responseLowerTrend.includes(kw))
    ) {
      trend = 'decreasing';
    }

    return {
      average,
      median,
      optimal: Math.round(optimal * 100) / 100,
      demand,
      competitorPrices: prices,
      trend,
      confidence: prices.length > 3 ? 0.8 : 0.5,
    };
  }

  private getDefaultMarketData(): MarketData {
    return {
      average: 500,
      median: 475,
      optimal: 550,
      demand: 0.6,
      competitorPrices: [450, 475, 500, 525, 550],
      trend: 'stable',
      confidence: 0.5,
    };
  }

  private getMockPerplexityResponse(): string {
    return `The current market for this product shows:
- Average selling price: $450-$550
- Price range: $400-$600
- High demand item, selling quickly
- Prices are stable, trending slightly upward
- Popular on eBay, Facebook Marketplace, and Craigslist`;
  }

  async analyzeProductValue(product: Product): Promise<MarketData> {
    return await this.analyzeProduct(product.title);
  }

  async calculateOptimalPrice(
    product: Product,
    marketData: MarketData
  ): Promise<number> {
    // Consider product cost, market data, and desired profit margin
    const minProfitMargin = 0.2; // 20% minimum
    const desiredMargin = 0.35; // 35% target

    // Start with market optimal price
    let optimalPrice = marketData.optimal;

    // Ensure minimum profit margin
    const minPrice = product.cost * (1 + minProfitMargin);
    if (optimalPrice < minPrice) {
      optimalPrice = minPrice;
    }

    // Adjust based on demand
    if (marketData.demand > 0.7) {
      optimalPrice *= 1.1; // Increase price if high demand
    } else if (marketData.demand < 0.4) {
      optimalPrice *= 0.95; // Slight discount if low demand
    }

    // Round to reasonable price points
    if (optimalPrice < 100) {
      optimalPrice = Math.round(optimalPrice);
    } else if (optimalPrice < 1000) {
      optimalPrice = Math.round(optimalPrice / 5) * 5; // Round to nearest $5
    } else {
      optimalPrice = Math.round(optimalPrice / 10) * 10; // Round to nearest $10
    }

    Logger.info(
      `Optimal price calculated: $${optimalPrice} (cost: $${product.cost}, margin: ${(((optimalPrice - product.cost) / product.cost) * 100).toFixed(1)}%)`
    );

    return optimalPrice;
  }

  async identifyTrends(
    productCategory: string
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    factors: string[];
  }> {
    Logger.info(`Identifying trends for category: ${productCategory}`);

    const query = `What are the current market trends for ${productCategory} products on online marketplaces? Are prices increasing, decreasing, or stable?`;

    try {
      const response = await retry(
        () => this.queryPerplexity(query),
        {
          maxAttempts: 3,
          delay: 1000,
          exponentialBackoff: true,
        }
      );

      // Simple trend extraction
      const responseLower = response.toLowerCase();
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      
      if (responseLower.includes('increasing') || responseLower.includes('rising')) {
        trend = 'increasing';
      } else if (responseLower.includes('decreasing') || responseLower.includes('dropping')) {
        trend = 'decreasing';
      }

      // Extract factors
      const factors: string[] = [];
      if (responseLower.includes('season')) factors.push('Seasonal demand');
      if (responseLower.includes('supply')) factors.push('Supply constraints');
      if (responseLower.includes('demand')) factors.push('Consumer demand');

      return {
        trend,
        confidence: 0.7,
        factors: factors.length > 0 ? factors : ['General market conditions'],
      };
    } catch (error) {
      Logger.error('Error identifying trends', error);
      return {
        trend: 'stable',
        confidence: 0.5,
        factors: ['Unable to determine'],
      };
    }
  }
}

