// Listing Agent - Multi-platform listing creation with SEO optimization
import { BrowserUseIntegration } from '../integrations/BrowserUseIntegration';
import { ComposioIntegration } from '../integrations/ComposioIntegration';
import { OpenAIIntegration } from '../integrations/OpenAIIntegration';
import { Agent } from '../core/agents/AgentRegistry';
import type { InventoryItem, Listing } from '../types';

interface ListingConfig {
  browserUse: BrowserUseIntegration;
  composio: ComposioIntegration;
  openai?: OpenAIIntegration;
}

interface ListingOptions {
  platforms: string[];
  price?: number;
  optimizeForSEO?: boolean;
}

export class ListingAgent implements Agent {
  public readonly name = 'listing';
  public status: 'idle' | 'active' | 'error' | 'stopped' = 'idle';
  
  private browserUse: BrowserUseIntegration;
  private composio: ComposioIntegration;
  private openai?: OpenAIIntegration;
  
  constructor(config: ListingConfig) {
    this.browserUse = config.browserUse;
    this.composio = config.composio;
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
      const browserHealth = await this.browserUse.healthCheck();
      const composioHealth = await this.composio.healthCheck();
      return browserHealth.healthy && composioHealth.healthy;
    } catch {
      return false;
    }
  }
  
  async createListing(item: InventoryItem, platforms: string[], options?: ListingOptions): Promise<Listing[]> {
    this.status = 'active';
    
    try {
      const listings: Listing[] = [];
      
      for (const platform of platforms) {
        try {
          const listing = await this.createListingForPlatform(item, platform, options);
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          console.error(`Failed to create listing on ${platform}:`, error);
        }
      }
      
      this.status = 'idle';
      return listings;
    } catch (error) {
      this.status = 'error';
      console.error('Listing creation error:', error);
      throw error;
    }
  }
  
  private async createListingForPlatform(
    item: InventoryItem,
    platform: string,
    options?: ListingOptions
  ): Promise<Listing | null> {
    // Generate SEO-optimized listing content
    const listingContent = await this.generateListingContent(item, platform, options);
    
    // Use Composio for API-based platforms
    if (this.isAPIPlatform(platform)) {
      const result = await this.composio.createListing(platform, {
        platform,
        title: listingContent.title,
        description: listingContent.description,
        price: options?.price || this.calculateOptimalPrice(item),
        images: item.images,
        category: item.category,
        condition: item.condition
      });
      
      if (result.success && result.listingId) {
        return {
          id: result.listingId,
          inventoryId: item.id,
          platform,
          platformListingId: result.listingId,
          url: result.url || '',
          title: listingContent.title,
          description: listingContent.description,
          price: options?.price || this.calculateOptimalPrice(item),
          images: item.images,
          status: 'active',
          visibility: 'public',
          metrics: {
            views: 0,
            watchers: 0,
            saves: 0,
            inquiries: 0,
            clicks: 0
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
    } else {
      // Use browser automation for platforms without API
      return await this.createListingViaBrowser(item, platform, listingContent, options);
    }
    
    return null;
  }
  
  private async generateListingContent(
    item: InventoryItem,
    platform: string,
    options?: ListingOptions
  ): Promise<{ title: string; description: string }> {
    if (this.openai && options?.optimizeForSEO) {
      const prompt = `Create an SEO-optimized marketplace listing:

Item: ${item.title}
Description: ${item.description}
Condition: ${item.condition}
Category: ${item.category}
Platform: ${platform}

Requirements:
1. Title: Max 80 chars, include keywords, condition, key features
2. Description: SEO-optimized, highlight benefits, include relevant keywords naturally
3. Use platform-appropriate tone

Output JSON with: title, description`;

      try {
        const content = await this.openai.jsonCompletion([
          { role: 'system', content: 'You are an expert at creating SEO-optimized marketplace listings.' },
          { role: 'user', content: prompt }
        ]);
        
        return {
          title: content.title || item.title,
          description: content.description || item.description
        };
      } catch (error) {
        console.error('Failed to generate SEO content:', error);
      }
    }
    
    // Fallback to basic generation
    return {
      title: this.generateTitle(item, platform),
      description: this.generateDescription(item, platform)
    };
  }
  
  private generateTitle(item: InventoryItem, platform: string): string {
    const keywords = [item.condition, item.category].filter(Boolean).join(' ');
    const title = `${item.title}${keywords ? ` - ${keywords}` : ''}`;
    return title.length > 80 ? title.substring(0, 77) + '...' : title;
  }
  
  private generateDescription(item: InventoryItem, platform: string): string {
    let description = item.description;
    
    // Add condition details
    description += `\n\nCondition: ${item.condition}`;
    
    // Add platform-specific elements
    if (platform === 'ebay') {
      description += '\n\nShipping available. Returns accepted.';
    } else if (platform === 'facebook' || platform === 'craigslist') {
      description += '\n\nLocal pickup preferred. Cash accepted.';
    }
    
    return description;
  }
  
  private calculateOptimalPrice(item: InventoryItem): number {
    // Calculate optimal listing price
    // This could include market research, competitor analysis, etc.
    const basePrice = item.purchasePrice;
    const profitMargin = 0.25; // 25% target profit
    const platformFees = this.getPlatformFeeRate(item.purchasePlatform) * basePrice;
    
    return basePrice * (1 + profitMargin) + platformFees;
  }
  
  private getPlatformFeeRate(platform: string): number {
    const rates: Record<string, number> = {
      'ebay': 0.13,
      'mercari': 0.10,
      'facebook': 0.05,
      'craigslist': 0,
      'offerup': 0.12
    };
    return rates[platform] || 0.10;
  }
  
  private isAPIPlatform(platform: string): boolean {
    // Platforms with API support via Composio
    return ['ebay', 'mercari'].includes(platform);
  }
  
  private async createListingViaBrowser(
    item: InventoryItem,
    platform: string,
    content: { title: string; description: string },
    options?: ListingOptions
  ): Promise<Listing | null> {
    const session = await this.browserUse.newSession({ headless: true });
    
    try {
      // Navigate to platform listing page
      await this.navigateToCreateListing(session, platform);
      
      // Fill in listing form
      await this.fillListingForm(session, platform, {
        title: content.title,
        description: content.description,
        price: options?.price || this.calculateOptimalPrice(item),
        images: item.images,
        category: item.category,
        condition: item.condition
      });
      
      // Submit listing
      await this.submitListing(session, platform);
      
      // Get listing URL
      const url = await session.getCurrentUrl();
      
      return {
        id: `${platform}-${Date.now()}`,
        inventoryId: item.id,
        platform,
        platformListingId: url.split('/').pop() || '',
        url,
        title: content.title,
        description: content.description,
        price: options?.price || this.calculateOptimalPrice(item),
        images: item.images,
        status: 'active',
        visibility: 'public',
        metrics: {
          views: 0,
          watchers: 0,
          saves: 0,
          inquiries: 0,
          clicks: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    } catch (error) {
      console.error(`Failed to create listing via browser on ${platform}:`, error);
      return null;
    } finally {
      await session.close();
    }
  }
  
  private async navigateToCreateListing(session: any, platform: string): Promise<void> {
    const urls: Record<string, string> = {
      'facebook': 'https://www.facebook.com/marketplace/create',
      'craigslist': 'https://post.craigslist.org/',
      'offerup': 'https://offerup.com/post'
    };
    
    const url = urls[platform];
    if (url) {
      await session.navigate(url);
    }
  }
  
  private async fillListingForm(
    session: any,
    platform: string,
    data: {
      title: string;
      description: string;
      price: number;
      images: string[];
      category: string;
      condition: string;
    }
  ): Promise<void> {
    // Platform-specific form filling
    // This is a simplified version - actual implementation would need platform-specific selectors
    
    switch (platform) {
      case 'facebook':
        await this.fillFacebookForm(session, data);
        break;
      case 'craigslist':
        await this.fillCraigslistForm(session, data);
        break;
      case 'offerup':
        await this.fillOfferUpForm(session, data);
        break;
    }
  }
  
  private async fillFacebookForm(session: any, data: any): Promise<void> {
    // Fill Facebook Marketplace form
    // Selectors would be platform-specific
    await session.waitFor('input[placeholder*="title" i], input[name*="title" i]', 10000);
    await session.fill('input[placeholder*="title" i], input[name*="title" i]', data.title);
    await session.fill('textarea[placeholder*="description" i]', data.description);
    await session.fill('input[type="number"], input[name*="price" i]', data.price.toString());
  }
  
  private async fillCraigslistForm(session: any, data: any): Promise<void> {
    // Fill Craigslist form
    await session.fill('input[name="PostingTitle"]', data.title);
    await session.fill('textarea[name="PostingBody"]', data.description);
    await session.fill('input[name="price"]', data.price.toString());
  }
  
  private async fillOfferUpForm(session: any, data: any): Promise<void> {
    // Fill OfferUp form
    await session.fill('input[placeholder*="title" i]', data.title);
    await session.fill('textarea[placeholder*="description" i]', data.description);
    await session.fill('input[type="number"]', data.price.toString());
  }
  
  private async submitListing(session: any, platform: string): Promise<void> {
    // Submit the listing
    const submitSelectors: Record<string, string> = {
      'facebook': 'button[type="submit"], button[aria-label*="Publish" i]',
      'craigslist': 'button[type="submit"], button[name="go"]',
      'offerup': 'button[type="submit"], button[class*="submit" i]'
    };
    
    const selector = submitSelectors[platform];
    if (selector) {
      await session.waitFor(selector, 10000);
      await session.click(selector);
      await session.waitFor('body', 5000); // Wait for redirect/confirmation
    }
  }
}

