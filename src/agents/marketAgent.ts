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
        return this.getDefaultMarketData(productName);
      }

      // Calculate statistics
      const sortedPrices = prices.sort((a, b) => a - b);
      const average = this.calculateAverage(prices);
      const median = this.calculateMedian(sortedPrices);
      const min = sortedPrices[0];
      const max = sortedPrices[sortedPrices.length - 1];
      const optimal = this.calculateOptimalPrice(prices);
      
      // Determine demand based on response content
      const demand = this.calculateDemand(response);
      
      // Determine trend (simplified - would need historical data)
      const trend = this.determineTrend(prices);

      return {
        productName,
        average,
        median,
        optimal,
        min,
        max,
        demand,
        trend,
        competitorCount: prices.length,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error analyzing product:', error);
      return this.getDefaultMarketData(productName);
    }
  }

  /**
   * Search Perplexity API
   */
  private async perplexitySearch(query: string): Promise<string> {
    if (!this.perplexityApiKey) {
      // Return mock data if API key not available
      return this.getMockResponse();
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
      return this.getMockResponse();
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
   * Calculate median price
   */
  private calculateMedian(sortedPrices: number[]): number {
    if (sortedPrices.length === 0) return 0;
    const mid = Math.floor(sortedPrices.length / 2);
    if (sortedPrices.length % 2 === 0) {
      return Math.round((sortedPrices[mid - 1] + sortedPrices[mid]) / 2);
    }
    return sortedPrices[mid];
  }

  /**
   * Calculate optimal selling price
   */
  private calculateOptimalPrice(prices: number[]): number {
    if (prices.length === 0) return 0;
    
    // Use 75th percentile as optimal (higher than median but not max)
    const sorted = [...prices].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.75);
    return sorted[index] || sorted[sorted.length - 1];
  }

  /**
   * Calculate demand level from response text
   */
  private calculateDemand(text: string): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('high demand') || lowerText.includes('popular') || lowerText.includes('sought after')) {
      return 'high';
    }
    if (lowerText.includes('low demand') || lowerText.includes('rare') || lowerText.includes('hard to find')) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Determine price trend
   */
  private determineTrend(prices: number[]): 'rising' | 'stable' | 'falling' {
    if (prices.length < 2) return 'stable';
    
    // Simple heuristic: compare first half vs second half
    const mid = Math.floor(prices.length / 2);
    const firstHalf = prices.slice(0, mid);
    const secondHalf = prices.slice(mid);
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    
    const diff = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  }

  /**
   * Get default market data when analysis fails
   */
  private getDefaultMarketData(productName: string): MarketData {
    return {
      productName,
      average: 100,
      median: 100,
      optimal: 120,
      min: 80,
      max: 150,
      demand: 'medium',
      trend: 'stable',
      competitorCount: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Mock response for testing
   */
  private getMockResponse(): string {
    return `Based on current market research, ${Math.floor(Math.random() * 100 + 50)} listings show prices ranging from $80 to $150, with an average of $120 and median of $110. The product shows medium demand with stable pricing trends.`;
  }
}
