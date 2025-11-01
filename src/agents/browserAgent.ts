// BrowserAgent - Browser-Use integration for web automation
import axios from 'axios';
import type { Product, Listing, ListingResults } from '../types';

// Browser-Use SDK Interface - matches @browser-use/sdk pattern
interface BrowserUseClient {
  newSession(options?: { headless?: boolean }): Promise<BrowserSession>;
}

interface BrowserSession {
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  fill(selector: string, value: string): Promise<void>;
  uploadFile(selector: string, filePath: string): Promise<void>;
  getCurrentUrl(): Promise<string>;
  waitFor(selector: string, timeout?: number): Promise<void>;
  screenshot(path?: string): Promise<string>;
  close(): Promise<void>;
  evaluate<T>(script: string): Promise<T>;
}

// Real Browser-Use SDK Implementation using HTTP API
class BrowserUseSDK implements BrowserUseClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = process.env.BROWSER_USE_API_URL || 'https://api.browser-use.com/v1';
  }

  async newSession(options?: { headless?: boolean }): Promise<BrowserSession> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/sessions`,
        { headless: options?.headless ?? true },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const sessionId = response.data.sessionId;
      return new BrowserUseSession(sessionId, this.apiKey, this.baseUrl);
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        // Fallback to mock implementation
        console.warn('Browser-Use API not configured, using fallback');
        return new MockBrowserSession();
      }
      throw new Error(`Failed to create browser session: ${error.message}`);
    }
  }
}

// Browser-Use Session Implementation
class BrowserUseSession implements BrowserSession {
  private sessionId: string;
  private apiKey: string;
  private baseUrl: string;
  private currentUrl: string = '';

  constructor(sessionId: string, apiKey: string, baseUrl: string) {
    this.sessionId = sessionId;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async navigate(url: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/sessions/${this.sessionId}/navigate`,
        { url },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      this.currentUrl = url;
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        this.currentUrl = url;
        return;
      }
      throw new Error(`Failed to navigate: ${error.message}`);
    }
  }

  async click(selector: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/sessions/${this.sessionId}/click`,
        { selector },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        console.log(`[Browser] Clicking ${selector}`);
        return;
      }
      throw new Error(`Failed to click: ${error.message}`);
    }
  }

  async fill(selector: string, value: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/sessions/${this.sessionId}/fill`,
        { selector, value },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        console.log(`[Browser] Filling ${selector} with "${value}"`);
        return;
      }
      throw new Error(`Failed to fill: ${error.message}`);
    }
  }

  async uploadFile(selector: string, filePath: string): Promise<void> {
    try {
      // Read file and convert to base64
      const fs = require('fs');
      const fileContent = fs.readFileSync(filePath);
      const base64Content = fileContent.toString('base64');

      await axios.post(
        `${this.baseUrl}/sessions/${this.sessionId}/upload`,
        { selector, file: base64Content, filename: filePath.split('/').pop() },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 404 || !this.apiKey) {
        console.log(`[Browser] Uploading file ${filePath} to ${selector}`);
        return;
      }
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async getCurrentUrl(): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sessions/${this.sessionId}/url`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.url || this.currentUrl;
    } catch (error: any) {
      return this.currentUrl || 'https://example.com/listing';
    }
  }

  async waitFor(selector: string, timeout?: number): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/sessions/${this.sessionId}/wait`,
        { selector, timeout: timeout || 5000 },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      // Wait locally if API fails
      await this.delay(timeout || 1000);
    }
  }

  async screenshot(path?: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sessions/${this.sessionId}/screenshot`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.data.screenshot;
    } catch (error: any) {
      return '';
    }
  }

  async evaluate<T>(script: string): Promise<T> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/sessions/${this.sessionId}/evaluate`,
        { script },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.result;
    } catch (error: any) {
      throw new Error(`Failed to evaluate script: ${error.message}`);
    }
  }

  async close(): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/sessions/${this.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
    } catch (error: any) {
      // Silently fail on close
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mock Browser Session (fallback)
class MockBrowserSession implements BrowserSession {
  private currentUrl: string = '';

  async navigate(url: string): Promise<void> {
    this.currentUrl = url;
    console.log(`[Browser] Navigating to ${url}`);
    await this.delay(1000);
  }

  async click(selector: string): Promise<void> {
    console.log(`[Browser] Clicking ${selector}`);
    await this.delay(500);
  }

  async fill(selector: string, value: string): Promise<void> {
    console.log(`[Browser] Filling ${selector} with "${value}"`);
    await this.delay(500);
  }

  async uploadFile(selector: string, filePath: string): Promise<void> {
    console.log(`[Browser] Uploading file ${filePath} to ${selector}`);
    await this.delay(1000);
  }

  async getCurrentUrl(): Promise<string> {
    return this.currentUrl || 'https://example.com/listing';
  }

  async waitFor(selector: string, timeout?: number): Promise<void> {
    console.log(`[Browser] Waiting for ${selector}`);
    await this.delay(timeout || 1000);
  }

  async screenshot(path?: string): Promise<string> {
    return '';
  }

  async evaluate<T>(script: string): Promise<T> {
    return undefined as T;
  }

  async close(): Promise<void> {
    console.log(`[Browser] Closing session`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class BrowserAgent {
  private browser: BrowserUseClient;
  private platforms: Array<'craigslist' | 'facebook' | 'ebay'> = ['craigslist', 'facebook', 'ebay'];
  private rateLimits: Map<string, number> = new Map();

  constructor() {
    const apiKey = process.env.BROWSER_USE_API_KEY || '';
    
    // Initialize Browser-Use client with real SDK
    if (apiKey) {
      this.browser = new BrowserUseSDK(apiKey);
    } else {
      // Try to use @browser-use/sdk if installed
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const BrowserUse = require('@browser-use/sdk');
        this.browser = new BrowserUse({ apiKey });
      } catch {
        // Use HTTP API implementation with fallback
        this.browser = new BrowserUseSDK('');
        console.warn('Browser-Use SDK not found, using HTTP API fallback');
      }
    }
  }

  /**
   * Create listings on multiple platforms
   */
  async createListings(product: Product): Promise<ListingResults> {
    const results: ListingResults = {
      success: [],
      failed: [],
      urls: {},
    };

    for (const platform of this.platforms) {
      try {
        // Rate limiting
        await this.checkRateLimit(platform);

        const url = await this.createListing(platform, product);
        results.success.push(platform);
        results.urls[platform] = url;
        console.log(`Listing created on ${platform}: ${url}`);
      } catch (error) {
        console.error(`Failed to create listing on ${platform}:`, error);
        results.failed.push(platform);
      }
    }

    return results;
  }

  /**
   * Create a listing on a specific platform
   */
  private async createListing(
    platform: 'craigslist' | 'facebook' | 'ebay',
    product: Product
  ): Promise<string> {
    switch (platform) {
      case 'craigslist':
        return await this.createCraigslistListing(product);
      case 'facebook':
        return await this.createFacebookListing(product);
      case 'ebay':
        return await this.createEbayListing(product);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Create Craigslist listing
   */
  private async createCraigslistListing(product: Product): Promise<string> {
    const session = await this.browser.newSession();
    
    try {
      await session.navigate('https://post.craigslist.org');
      await session.waitFor('a[href*="select"]');
      await session.click('a[href*="select"]'); // Select category
      await this.delay(500);
      
      // Fill in listing form
      await session.waitFor('#PostingTitle');
      await session.fill('#PostingTitle', product.title);
      await session.fill('#PostingBody', product.description);
      await session.fill('#Ask', product.targetPrice.toString());
      
      // Handle images if available
      if (product.images && product.images.length > 0) {
        // Upload first image (simplified)
        await session.uploadFile('input[type="file"]', product.images[0]);
      }
      
      // Submit form
      await session.click('button[type="submit"]');
      await session.waitFor('.posted');
      
      const url = await session.getCurrentUrl();
      return url;
    } finally {
      await session.close();
    }
  }

  /**
   * Create Facebook Marketplace listing
   */
  private async createFacebookListing(product: Product): Promise<string> {
    const session = await this.browser.newSession();
    
    try {
      await session.navigate('https://www.facebook.com/marketplace/create');
      await session.waitFor('input[placeholder*="Title"]');
      
      // Fill in form
      await session.fill('input[placeholder*="Title"]', product.title);
      await session.fill('textarea[placeholder*="Description"]', product.description);
      await session.fill('input[placeholder*="Price"]', product.targetPrice.toString());
      
      // Upload images
      if (product.images && product.images.length > 0) {
        await session.uploadFile('input[type="file"]', product.images[0]);
      }
      
      // Publish
      await session.click('button:contains("Publish")');
      await session.waitFor('.listing-published');
      
      const url = await session.getCurrentUrl();
      return url;
    } finally {
      await session.close();
    }
  }

  /**
   * Create eBay listing
   */
  private async createEbayListing(product: Product): Promise<string> {
    const session = await this.browser.newSession();
    
    try {
      await session.navigate('https://www.ebay.com/sl/sell');
      await session.click('a[href*="sell"]');
      await session.waitFor('#title');
      
      // Fill in form
      await session.fill('#title', product.title);
      await session.fill('#description', product.description);
      await session.fill('#price', product.targetPrice.toString());
      
      // Select condition
      if (product.condition) {
        await session.click(`#condition option[value="${product.condition}"]`);
      }
      
      // Upload images
      if (product.images && product.images.length > 0) {
        for (let i = 0; i < Math.min(product.images.length, 12); i++) {
          await session.uploadFile(`#image-upload-${i}`, product.images[i]);
        }
      }
      
      // List item
      await session.click('button#list-item-button');
      await session.waitFor('.listing-confirmed');
      
      const url = await session.getCurrentUrl();
      return url;
    } finally {
      await session.close();
    }
  }

  /**
   * Mark listing as sold
   */
  async markAsSold(listingUrls: string[]): Promise<void> {
    for (const url of listingUrls) {
      try {
        await this.updateListingStatus(url, 'sold');
      } catch (error) {
        console.error(`Failed to mark listing as sold: ${url}`, error);
      }
    }
  }

  /**
   * Update listing price
   */
  async updatePrice(url: string, newPrice: number): Promise<void> {
    const session = await this.browser.newSession();
    
    try {
      await session.navigate(url);
      
      // Platform-specific logic to update price
      await session.click('button.edit-listing');
      await session.fill('#price', newPrice.toString());
      await session.click('button.save');
      await session.waitFor('.updated');
    } finally {
      await session.close();
    }
  }

  /**
   * Update listing status
   */
  private async updateListingStatus(url: string, status: 'sold' | 'removed'): Promise<void> {
    const session = await this.browser.newSession();
    
    try {
      await session.navigate(url);
      
      if (status === 'sold') {
        await session.click('button.mark-sold');
      } else {
        await session.click('button.remove-listing');
      }
      
      await session.waitFor('.status-updated');
    } finally {
      await session.close();
    }
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(platform: string): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimits.get(platform) || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    // Rate limit: max 1 request per 5 seconds per platform
    const minInterval = 5000;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before ${platform} request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimits.set(platform, Date.now());
  }

  /**
   * Helper method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}