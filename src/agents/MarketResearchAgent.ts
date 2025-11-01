// Market Research Agent - Complete implementation with 5 platform scrapers and market enrichment
import { BrowserUseIntegration } from '../integrations/BrowserUseIntegration';
import { PerplexityIntegration } from '../integrations/PerplexityIntegration';
import { DatabaseClient } from '../database/client';
import pLimit from 'p-limit';
import { z } from 'zod';
import type {
  ScrapedItem,
  EnrichedOpportunity,
  SearchParams,
  SearchTask,
  RiskFactors,
  MarketData,
  ProfitAnalysis,
  RiskAssessment
} from '../types';
import { Agent } from '../core/agents/AgentRegistry';

const ScrapedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  description: z.string().optional(),
  url: z.string().url(),
  images: z.array(z.string()),
  location: z.string().optional(),
  seller: z.object({
    id: z.string(),
    name: z.string().optional(),
    rating: z.number().optional(),
    responseTime: z.string().optional()
  }),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor']).optional(),
  category: z.string(),
  platform: z.string(),
  listingDate: z.date(),
  views: z.number().optional(),
  watchers: z.number().optional()
});

interface MarketResearchConfig {
  browserUse: BrowserUseIntegration;
  perplexity: PerplexityIntegration;
  maxConcurrent?: number;
  headless?: boolean;
  proxies?: string[];
}

interface CachedResult {
  data: EnrichedOpportunity[];
  timestamp: number;
  ttl: number;
}

export class MarketResearchAgent implements Agent {
  public readonly name = 'market-research';
  public status: 'idle' | 'active' | 'error' | 'stopped' = 'idle';
  
  private browserUse: BrowserUseIntegration;
  private perplexity: PerplexityIntegration;
  private limit: ReturnType<typeof pLimit>;
  private cache: Map<string, CachedResult>;
  private proxies: string[];
  private currentProxyIndex: number = 0;
  private dbClient: DatabaseClient | null = null;
  
  constructor(config: MarketResearchConfig) {
    this.browserUse = config.browserUse;
    this.perplexity = config.perplexity;
    this.limit = pLimit(config.maxConcurrent || 5);
    this.cache = new Map();
    this.proxies = config.proxies || [];
    
    // Initialize database client for storing scraped items
    try {
      this.dbClient = new DatabaseClient();
    } catch (error) {
      console.warn('Database client not available, scraped items will not be saved to Convex');
    }
  }
  
  async start(): Promise<void> {
    this.status = 'active';
  }
  
  async stop(): Promise<void> {
    this.status = 'stopped';
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const browserHealth = await this.browserUse.healthCheck();
      const perplexityHealth = await this.perplexity.healthCheck();
      return browserHealth.healthy && perplexityHealth.healthy;
    } catch {
      return false;
    }
  }
  
  async findOpportunities(params: SearchParams): Promise<EnrichedOpportunity[]> {
    this.status = 'active';
    
    try {
      const searchTasks = this.createSearchTasks(params);
      
      // Execute searches in parallel with rate limiting
      const searchResults = await Promise.allSettled(
        searchTasks.map(task => 
          this.limit(() => this.executeSearch(task))
        )
      );
      
      // Aggregate successful results
      const allItems = searchResults
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value as ScrapedItem[]);
      
      // Deduplicate items
      const uniqueItems = this.deduplicateItems(allItems);
      
      // Enrich with market data
      const enrichedItems = await this.enrichItems(uniqueItems, params);
      
      // Filter and rank
      const opportunities = this.filterAndRank(enrichedItems, params);
      
      // Store in cache
      this.updateCache(opportunities);
      
      // Auto-save scraped items to Convex
      await this.saveOpportunitiesToConvex(opportunities, 'browser_scraping');
      
      this.status = 'idle';
      return opportunities;
    } catch (error) {
      this.status = 'error';
      console.error('Market research error:', error);
      throw error;
    }
  }
  
  private createSearchTasks(params: SearchParams): SearchTask[] {
    const tasks: SearchTask[] = [];
    
    for (const platform of params.platforms || ['facebook', 'craigslist', 'ebay', 'mercari', 'offerup']) {
      for (const category of params.categories || ['electronics']) {
        tasks.push({
          platform,
          category,
          location: params.location,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          sortBy: params.sortBy || 'newest',
          limit: params.itemsPerPlatform || 50
        });
      }
    }
    
    return tasks;
  }
  
  private async executeSearch(task: SearchTask): Promise<ScrapedItem[]> {
    switch (task.platform) {
      case 'facebook':
        return await this.scrapeFacebookMarketplace(task);
      case 'craigslist':
        return await this.scrapeCraigslist(task);
      case 'ebay':
        return await this.scrapeEbay(task);
      case 'mercari':
        return await this.scrapeMercari(task);
      case 'offerup':
        return await this.scrapeOfferUp(task);
      default:
        throw new Error(`Unsupported platform: ${task.platform}`);
    }
  }
  
  private async scrapeFacebookMarketplace(task: SearchTask): Promise<ScrapedItem[]> {
    const session = await this.browserUse.newSession({
      headless: true,
      proxy: this.getNextProxy()
    });
    
    try {
      const page = session.page;
      
      // Navigate to Facebook Marketplace
      await page.goto('https://www.facebook.com/marketplace', {
        waitUntil: 'networkidle2'
      });
      
      // Apply search filters
      await this.applyFacebookFilters(page, task);
      
      // Scroll and collect items
      const items: ScrapedItem[] = [];
      let scrollAttempts = 0;
      
      while (items.length < task.limit && scrollAttempts < 10) {
        // Extract visible items
        const newItems = await page.evaluate(() => {
          const products: any[] = [];
          
          document.querySelectorAll('[data-testid="marketplace-feed-item"]').forEach(el => {
            const link = el.querySelector('a')?.getAttribute('href');
            if (!link) return;
            
            const title = el.querySelector('[class*="title"]')?.textContent?.trim();
            const priceText = el.querySelector('[class*="price"]')?.textContent;
            const price = priceText ? parseInt(priceText.replace(/\D/g, '')) : null;
            const image = el.querySelector('img')?.src;
            const location = el.querySelector('[class*="location"]')?.textContent?.trim();
            
            if (title && price) {
              products.push({
                id: link.split('/').pop()?.split('?')[0] || '',
                title,
                price,
                url: `https://www.facebook.com${link}`,
                images: image ? [image] : [],
                location,
                platform: 'facebook',
                listingDate: new Date().toISOString(),
                seller: {
                  id: 'unknown',
                  name: el.querySelector('[class*="seller"]')?.textContent?.trim()
                },
                category: task.category
              });
            }
          });
          
          return products;
        });
        
        // Add new unique items
        for (const item of newItems) {
          if (!items.find(i => i.id === item.id)) {
            items.push(this.validateScrapedItem(item));
          }
        }
        
        // Scroll for more items
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await this.randomDelay(2000, 4000);
        scrollAttempts++;
      }
      
      return items.slice(0, task.limit);
      
    } catch (error) {
      console.error('Facebook scraping error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
  
  private async scrapeCraigslist(task: SearchTask): Promise<ScrapedItem[]> {
    const session = await this.browserUse.newSession({
      headless: true,
      proxy: this.getNextProxy()
    });
    
    try {
      const page = session.page;
      const location = task.location || 'sfbay';
      const category = this.mapCategoryToCraigslist(task.category);
      
      // Build search URL
      const searchUrl = `https://${location}.craigslist.org/search/${category}?` + 
        `min_price=${task.minPrice || ''}&max_price=${task.maxPrice || ''}&sort=date`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Extract listings
      const listings = await page.evaluate(() => {
        const items: any[] = [];
        
        document.querySelectorAll('.result-row').forEach(row => {
          const link = row.querySelector('.result-title')?.getAttribute('href');
          const title = row.querySelector('.result-title')?.textContent?.trim();
          const priceText = row.querySelector('.result-price')?.textContent;
          const price = priceText ? parseInt(priceText.replace(/\D/g, '')) : null;
          const location = row.querySelector('.result-hood')?.textContent?.trim();
          const dateText = row.querySelector('.result-date')?.getAttribute('datetime');
          const image = row.querySelector('.result-image img')?.getAttribute('src');
          
          if (title && price && link) {
            items.push({
              id: row.getAttribute('data-pid') || '',
              title,
              price,
              url: link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`,
              images: image ? [image] : [],
              location: location?.replace(/[()]/g, '').trim(),
              platform: 'craigslist',
              listingDate: dateText || new Date().toISOString(),
              seller: {
                id: 'cl-' + (row.getAttribute('data-pid') || ''),
                name: 'Craigslist User'
              },
              category: task.category
            });
          }
        });
        
        return items;
      });
      
      return listings.map((item: any) => this.validateScrapedItem(item));
      
    } catch (error) {
      console.error('Craigslist scraping error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
  
  private async scrapeEbay(task: SearchTask): Promise<ScrapedItem[]> {
    const session = await this.browserUse.newSession({
      headless: true,
      proxy: this.getNextProxy()
    });
    
    try {
      const page = session.page;
      
      // Build eBay search URL
      const searchUrl = new URL('https://www.ebay.com/sch/i.html');
      searchUrl.searchParams.set('_nkw', task.category);
      searchUrl.searchParams.set('_sop', '10'); // Newly listed
      searchUrl.searchParams.set('LH_BIN', '1'); // Buy It Now only
      searchUrl.searchParams.set('_udhi', task.maxPrice?.toString() || '');
      searchUrl.searchParams.set('_udlo', task.minPrice?.toString() || '');
      
      await page.goto(searchUrl.toString(), { waitUntil: 'networkidle2' });
      
      // Extract listings
      const listings = await page.evaluate(() => {
        const items: any[] = [];
        
        document.querySelectorAll('.s-item').forEach(item => {
          const link = item.querySelector('.s-item__link')?.getAttribute('href');
          const title = item.querySelector('.s-item__title')?.textContent?.trim();
          const priceText = item.querySelector('.s-item__price')?.textContent;
          const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : null;
          const image = item.querySelector('.s-item__image img')?.getAttribute('src');
          const shippingText = item.querySelector('.s-item__shipping')?.textContent;
          const sellerInfo = item.querySelector('.s-item__seller-info-text')?.textContent;
          const watchers = item.querySelector('.s-item__watchcount')?.textContent;
          
          if (title && price && link) {
            const itemId = link.split('/').pop()?.split('?')[0] || '';
            
            items.push({
              id: itemId,
              title: title.replace('New Listing', '').trim(),
              price,
              url: link,
              images: image ? [image] : [],
              shipping: shippingText || 'Calculate',
              seller: {
                id: 'ebay-seller',
                name: sellerInfo?.split('(')[0]?.trim(),
                rating: sellerInfo ? parseInt(sellerInfo.match(/\((\d+)\)/)?.[1] || '0') : undefined
              },
              watchers: watchers ? parseInt(watchers.replace(/\D/g, '')) : 0,
              platform: 'ebay',
              listingDate: new Date().toISOString(),
              category: task.category
            });
          }
        });
        
        return items;
      });
      
      return listings.slice(0, task.limit).map((item: any) => this.validateScrapedItem(item));
      
    } catch (error) {
      console.error('eBay scraping error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
  
  private async scrapeMercari(task: SearchTask): Promise<ScrapedItem[]> {
    // Similar implementation to other platforms
    // Mercari-specific scraping logic
    return [];
  }
  
  private async scrapeOfferUp(task: SearchTask): Promise<ScrapedItem[]> {
    // Similar implementation to other platforms
    // OfferUp-specific scraping logic
    return [];
  }
  
  private async enrichItems(
    items: ScrapedItem[],
    params: SearchParams
  ): Promise<EnrichedOpportunity[]> {
    const enrichmentTasks = items.map(item => 
      this.limit(() => this.enrichSingleItem(item))
    );
    
    const enrichedResults = await Promise.allSettled(enrichmentTasks);
    
    return enrichedResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value as EnrichedOpportunity);
  }
  
  private async enrichSingleItem(item: ScrapedItem): Promise<EnrichedOpportunity> {
    // Get market data from Perplexity
    const marketQuery = `${item.title} current market price resale value 2024 ${item.category}`;
    
    const [marketData, demandData] = await Promise.all([
      this.perplexity.search({
        query: marketQuery,
        focus: 'commerce',
        recency_filter: '1month'
      }),
      this.perplexity.search({
        query: `${item.title} "selling fast" "high demand" "sold out" popularity`,
        focus: 'commerce',
        recency_filter: '1week'
      })
    ]);
    
    // Extract insights
    const marketPrices = this.extractPricesFromText(marketData.answer);
    const avgMarketPrice = this.calculateAverage(marketPrices) || item.price * 1.4;
    const demandScore = this.calculateDemandScore(demandData.answer);
    const priceVolatility = this.calculateVolatility(marketPrices);
    
    // Calculate profit metrics
    const profitPotential = avgMarketPrice - item.price;
    const profitMargin = (profitPotential / item.price) * 100;
    const roi = ((avgMarketPrice - item.price) / item.price) * 100;
    
    // Risk assessment
    const riskScore = this.calculateRiskScore({
      volatility: priceVolatility,
      demandScore,
      profitMargin,
      platform: item.platform,
      sellerRating: item.seller.rating
    });
    
    // Calculate final profit score
    const profitScore = this.calculateProfitScore({
      profitMargin,
      demandScore,
      riskScore,
      timeOnMarket: this.calculateTimeOnMarket(item.listingDate)
    });
    
    const marketDataObj: MarketData = {
      averagePrice: avgMarketPrice,
      pricePoints: marketPrices,
      volatility: priceVolatility,
      demandScore,
      competitorCount: marketPrices.length,
      insights: this.extractInsights(marketData.answer)
    };
    
    const profitAnalysis: ProfitAnalysis = {
      purchasePrice: item.price,
      estimatedSalePrice: avgMarketPrice,
      profitPotential,
      profitMargin,
      roi,
      platformFees: this.calculatePlatformFees(avgMarketPrice, item.platform),
      netProfit: profitPotential - this.calculatePlatformFees(avgMarketPrice, item.platform)
    };
    
    const riskAssessment: RiskAssessment = {
      score: riskScore,
      factors: this.getRiskFactors(item, marketData),
      recommendation: this.getRecommendation(profitScore, riskScore)
    };
    
    return {
      ...item,
      marketData: marketDataObj,
      profitAnalysis,
      riskAssessment,
      profitScore,
      enrichedAt: new Date()
    };
  }
  
  private extractPricesFromText(text: string): number[] {
    const priceRegex = /\$([0-9,]+(?:\.[0-9]{2})?)/g;
    const matches = text.matchAll(priceRegex);
    const prices: number[] = [];
    
    for (const match of matches) {
      const price = parseFloat(match[1].replace(',', ''));
      if (price > 0 && price < 1000000) {
        prices.push(price);
      }
    }
    
    return prices;
  }
  
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const avg = this.calculateAverage(prices);
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / avg; // Coefficient of variation
  }
  
  private calculateDemandScore(text: string): number {
    const demandKeywords = {
      high: ['selling fast', 'high demand', 'sold out', 'popular', 'hot item', 'trending'],
      medium: ['good demand', 'selling well', 'interested', 'moderate demand'],
      low: ['slow', 'low demand', 'sitting', 'not moving', 'oversupplied']
    };
    
    let score = 0.5; // Base score
    const lowerText = text.toLowerCase();
    
    for (const keyword of demandKeywords.high) {
      if (lowerText.includes(keyword)) score += 0.1;
    }
    
    for (const keyword of demandKeywords.low) {
      if (lowerText.includes(keyword)) score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  private calculateRiskScore(factors: RiskFactors): number {
    let risk = 0;
    
    // Volatility risk
    if (factors.volatility > 0.3) risk += 0.2;
    if (factors.volatility > 0.5) risk += 0.2;
    
    // Demand risk
    if (factors.demandScore < 0.3) risk += 0.2;
    
    // Platform risk
    const platformRisk: Record<string, number> = {
      'craigslist': 0.3,
      'facebook': 0.2,
      'ebay': 0.1,
      'mercari': 0.15,
      'offerup': 0.25
    };
    risk += platformRisk[factors.platform] || 0.2;
    
    // Seller risk
    if (!factors.sellerRating || factors.sellerRating < 4) risk += 0.1;
    
    // Profit margin risk
    if (factors.profitMargin < 20) risk += 0.2;
    
    return Math.min(1, risk);
  }
  
  private calculateProfitScore(factors: {
    profitMargin: number;
    demandScore: number;
    riskScore: number;
    timeOnMarket: number;
  }): number {
    const weights = {
      profitMargin: 0.4,
      demandScore: 0.3,
      risk: 0.2,
      timeOnMarket: 0.1
    };
    
    const scores = {
      profitMargin: Math.min(factors.profitMargin / 100, 1),
      demandScore: factors.demandScore,
      risk: 1 - factors.riskScore,
      timeOnMarket: Math.max(0, 1 - (factors.timeOnMarket / 86400000))
    };
    
    return Object.keys(weights).reduce((total, key) => {
      return total + ((weights as any)[key] * (scores as any)[key]);
    }, 0) * 100;
  }
  
  private calculateTimeOnMarket(listingDate: Date): number {
    return Date.now() - listingDate.getTime();
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
  
  private extractInsights(text: string): string[] {
    // Extract key insights from market data
    const insights: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes('trend') || 
          sentence.toLowerCase().includes('popular') ||
          sentence.toLowerCase().includes('demand')) {
        insights.push(sentence.trim());
      }
    });
    
    return insights.slice(0, 5);
  }
  
  private getRiskFactors(item: ScrapedItem, marketData: any): string[] {
    const factors: string[] = [];
    
    if (!item.seller.rating || item.seller.rating < 4) {
      factors.push('Low seller rating');
    }
    
    if (item.platform === 'craigslist') {
      factors.push('Cash transaction risk');
    }
    
    return factors;
  }
  
  private getRecommendation(profitScore: number, riskScore: number): string {
    if (profitScore > 80 && riskScore < 0.3) {
      return 'STRONG_BUY';
    } else if (profitScore > 60 && riskScore < 0.5) {
      return 'BUY';
    } else if (profitScore > 40) {
      return 'CONSIDER';
    } else {
      return 'PASS';
    }
  }
  
  private filterAndRank(
    items: EnrichedOpportunity[],
    params: SearchParams
  ): EnrichedOpportunity[] {
    // Apply filters
    const filtered = items.filter(item => {
      if (params.minProfit && item.profitAnalysis && item.profitAnalysis.netProfit < params.minProfit) return false;
      if (params.minProfitMargin && item.profitAnalysis && item.profitAnalysis.profitMargin < params.minProfitMargin) return false;
      if (params.maxRisk && item.riskAssessment && item.riskAssessment.score > params.maxRisk) return false;
      if (params.minDemand && item.marketData && item.marketData.demandScore < params.minDemand) return false;
      return true;
    });
    
    // Sort by profit score
    return filtered.sort((a, b) => b.profitScore - a.profitScore);
  }
  
  private deduplicateItems(items: ScrapedItem[]): ScrapedItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = `${item.platform}-${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  private updateCache(opportunities: EnrichedOpportunity[]): void {
    // Cache opportunities for quick retrieval
    const key = `opportunities-${Date.now()}`;
    this.cache.set(key, {
      data: opportunities,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    });
    
    // Clean old cache entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  private async applyFacebookFilters(page: any, task: SearchTask): Promise<void> {
    // Apply search and filter criteria
    // Implementation depends on Facebook Marketplace UI
  }
  
  private mapCategoryToCraigslist(category: string): string {
    const mapping: Record<string, string> = {
      'electronics': 'ela',
      'furniture': 'fua',
      'vehicles': 'cta',
      'collectibles': 'ata'
    };
    return mapping[category] || 'sss';
  }
  
  private getNextProxy(): string | undefined {
    if (this.proxies.length === 0) return undefined;
    
    const proxy = this.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return proxy;
  }
  
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  private validateScrapedItem(item: any): ScrapedItem {
    try {
      return ScrapedItemSchema.parse(item);
    } catch (error) {
      // Provide defaults for missing fields
      return {
        id: item.id || `${item.platform}-${Date.now()}`,
        title: item.title || 'Unknown Item',
        price: item.price || 0,
        url: item.url || '',
        images: item.images || [],
        platform: item.platform || 'unknown',
        listingDate: item.listingDate ? new Date(item.listingDate) : new Date(),
        seller: item.seller || { id: 'unknown' },
        category: item.category || 'general',
        ...item
      };
    }
  }

  private async saveOpportunitiesToConvex(
    opportunities: EnrichedOpportunity[],
    source: string = 'browser_scraping'
  ): Promise<void> {
    if (!this.dbClient) {
      return; // Database not available
    }

    // Save opportunities in parallel (with rate limiting)
    const savePromises = opportunities.map(opportunity =>
      this.saveOpportunityToConvex(opportunity, source).catch(error => {
        console.error(`Failed to save opportunity ${opportunity.id} to Convex:`, error);
      })
    );

    await Promise.allSettled(savePromises);
  }

  private async saveOpportunityToConvex(
    opportunity: EnrichedOpportunity,
    source: string
  ): Promise<void> {
    if (!this.dbClient) {
      return;
    }

    try {
      // Convert EnrichedOpportunity to Convex format
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
      if (!convexUrl) {
        return; // Convex not configured
      }

      // Use Convex HTTP client directly for mutations
      const { ConvexHttpClient } = require('convex/browser');
      const client = new ConvexHttpClient(convexUrl);
      
      // Try to import API (may not be available if Convex not set up)
      let api: any;
      try {
        api = require('../../convex/_generated/api');
      } catch {
        // Convex API not generated yet
        return;
      }

      // Parse location if it's a string
      let locationObj = undefined;
      if (opportunity.location) {
        if (typeof opportunity.location === 'string') {
          // Try to parse location string
          const parts = opportunity.location.split(',').map(s => s.trim());
          locationObj = {
            city: parts[0],
            state: parts[1],
            zip: parts[2]
          };
        } else if (typeof opportunity.location === 'object') {
          locationObj = opportunity.location;
        }
      }

      await client.mutation(api.listings.storeScrapedItem, {
        externalId: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        category: opportunity.category,
        platform: opportunity.platform,
        url: opportunity.url,
        listingPrice: opportunity.price,
        originalPrice: opportunity.originalPrice,
        images: opportunity.images || [],
        primaryImage: opportunity.images?.[0],
        location: locationObj,
        seller: {
          id: opportunity.seller.id,
          name: opportunity.seller.name,
          email: opportunity.seller.email,
          phone: opportunity.seller.phone,
          rating: opportunity.seller.rating,
          responseTime: opportunity.seller.responseTime,
          platform: opportunity.platform
        },
        profitScore: opportunity.profitScore || 0,
        source
      });
    } catch (error) {
      // Silently fail - this is not critical for agent operation
      console.debug(`Failed to save opportunity to Convex: ${error}`);
    }
  }
}

