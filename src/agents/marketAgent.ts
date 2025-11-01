// MarketAgent - Perplexity integration for market intelligence
import axios from 'axios';
import type { MarketData } from '../types';

export class MarketAgent {
  private perplexityApiKey: string;
  private perplexityBaseUrl = 'https://api.perplexity.ai';

  constructor() {
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.perplexityApiKey) {
      console.warn('Perplexity API key not configured. Market analysis will be limited.');
    }
  }

  /**
   * Analyze product value and market conditions
   */
  async analyzeProduct(productName: string): Promise<MarketData> {
    console.log(`Analyzing market for: ${productName}`);

    try {
      // Query Perplexity for current market prices
      const query = `What is the current selling price for ${productName} on online marketplaces like eBay, Craigslist, and Facebook Marketplace in 2024? Include average, median, and typical price range.`;
      
      const response = await this.perplexitySearch(query);
      
      // Extract prices from response
      const prices = this.extractPrices(response);
      
      if (prices.length === 0) {
        // Fallback to default data
        return this.getDefaultMarketData();
      }

      // Calculate statistics
      const average = this.calculateAverage(prices);
      const volatility = this.calculateVolatility(prices);
      const demandScore = this.calculateDemandScore(response);
      const insights = this.extractInsights(response);

      return {
        averagePrice: average,
        pricePoints: prices,
        volatility: volatility,
        demandScore: demandScore,
        competitorCount: prices.length,
        insights: insights,
      };
    } catch (error) {
      console.error('Error analyzing product:', error);
      return this.getDefaultMarketData();
    }
  }

  /**
   * Search Perplexity API
   */
  private async perplexitySearch(query: string): Promise<string> {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.perplexityBaseUrl}/chat/completions`,
        {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }

  /**
   * Extract prices from text response
   */
  private extractPrices(text: string): number[] {
    const prices: number[] = [];
    
    // Match dollar amounts ($XXX, $XXX.XX, $X,XXX)
    const priceRegex = /\$[\d,]+\.?\d*/g;
    const matches = text.match(priceRegex);
    
    if (matches) {
      for (const match of matches) {
        const price = parseFloat(match.replace(/[$,]/g, ''));
        if (!isNaN(price) && price > 0 && price < 1000000) {
          // Reasonable price range filter
          prices.push(price);
        }
      }
    }

    return prices;
  }

  /**
   * Calculate average price
   */
  private calculateAverage(prices: number[]): number {
    if (prices.length === 0) return 0;
    const sum = prices.reduce((a, b) => a + b, 0);
    return Math.round(sum / prices.length);
  }

  /**
   * Calculate volatility (standard deviation as percentage of average)
   */
  private calculateVolatility(prices: number[]): number {
    if (prices.length === 0) return 0;
    
    const avg = this.calculateAverage(prices);
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / avg;
  }

  /**
   * Calculate demand score from response text (0-1)
   */
  private calculateDemandScore(text: string): number {
    const lowerText = text.toLowerCase();
    
    let score = 0.5; // default medium
    
    if (lowerText.includes('high demand') || lowerText.includes('popular') || lowerText.includes('sought after')) {
      score = 0.8;
    } else if (lowerText.includes('extremely popular') || lowerText.includes('selling out')) {
      score = 1.0;
    } else if (lowerText.includes('low demand') || lowerText.includes('rare') || lowerText.includes('hard to find')) {
      score = 0.2;
    } else if (lowerText.includes('no interest') || lowerText.includes('not selling')) {
      score = 0.0;
    }
    
    return score;
  }

  /**
   * Extract insights from response text
   */
  private extractInsights(text: string): string[] {
    const insights: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Extract key sentences as insights
    for (const sentence of sentences.slice(0, 3)) {
      if (sentence.length < 200) {
        insights.push(sentence.trim());
      }
    }
    
    return insights.length > 0 ? insights : ['Market data retrieved successfully'];
  }

  /**
   * Get default market data when analysis fails
   */
  private getDefaultMarketData(): MarketData {
    return {
      averagePrice: 100,
      pricePoints: [80, 100, 120, 150],
      volatility: 0.15,
      demandScore: 0.5,
      competitorCount: 0,
      insights: ['Unable to retrieve market data'],
    };
  }

}
