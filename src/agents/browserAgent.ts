// BrowserAgent - Browser-Use Cloud API integration for AI-powered web automation
import axios from 'axios';
import type { Product, ListingResults } from '../types';

interface BrowserUseTask {
  id: string;
  task: string;
  status: 'queued' | 'running' | 'finished' | 'failed' | 'error';
  output: string | null;
  live_url: string;
  created_at: string;
  finished_at: string | null;
  steps: any[];
  browser_data: {
    cookies: any[];
  };
  output_files: string[];
}

interface TaskResult {
  success: boolean;
  output?: string;
  liveUrl?: string;
  error?: string;
}

export class BrowserAgent {
  private apiKey: string;
  private baseUrl: string;
  private platforms: Array<'craigslist' | 'facebook' | 'ebay'> = ['craigslist', 'facebook', 'ebay'];

  constructor() {
    this.apiKey = process.env.BROWSER_USE_API_KEY || '';
    this.baseUrl = 'https://api.browser-use.com/api/v1';

    if (!this.apiKey) {
      console.warn('[Browser-Use] API key not configured');
    } else {
      console.log('[Browser-Use] ✅ Initialized with Cloud API');
    }
  }

  /**
   * Create listings on multiple platforms using AI-powered browser automation
   */
  async createListings(product: Product): Promise<ListingResults> {
    console.log(`\n[Browser-Use] Creating listings for: ${product.title}`);

    const results: ListingResults = {
      success: [],
      failed: [],
      urls: {},
    };

    // Create listings sequentially to avoid overwhelming the API
    for (const platform of this.platforms) {
      try {
        console.log(`[Browser-Use] Creating ${platform} listing...`);
        const url = await this.createListingWithRetry(platform, product, 2);

        results.success.push(platform);
        results.urls[platform] = url;
        console.log(`[Browser-Use] ✅ ${platform}: ${url}`);
      } catch (error: any) {
        console.error(`[Browser-Use] ❌ ${platform} failed:`, error.message);
        results.failed.push(platform);

        // Use fallback URL for failed platforms
        results.urls[platform] = this.getFallbackUrl(platform);
      }

      // Rate limiting: wait between platform requests
      if (platform !== this.platforms[this.platforms.length - 1]) {
        await this.delay(3000); // 3 second delay between platforms
      }
    }

    return results;
  }

  /**
   * Create a platform listing with retry logic
   */
  private async createListingWithRetry(
    platform: 'craigslist' | 'facebook' | 'ebay',
    product: Product,
    maxRetries: number = 2
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const taskId = await this.createPlatformListingTask(platform, product);
        console.log(`[Browser-Use] Task created: ${taskId}`);

        const result = await this.waitForTask(taskId, 300000); // 5 minute timeout

        if (result.success && result.output) {
          // Extract URL from output
          const url = this.extractUrl(result.output, platform);
          if (url) {
            return url;
          }

          // If no URL found in output, use live_url or fallback
          if (result.liveUrl) {
            console.log(`[Browser-Use] No URL in output, using live session: ${result.liveUrl}`);
          }

          return result.output; // Return the output text if no URL found
        } else {
          console.warn(`[Browser-Use] Task failed (attempt ${attempt}/${maxRetries}): ${result.error}`);

          if (attempt < maxRetries) {
            console.log(`[Browser-Use] Retrying in ${attempt * 2} seconds...`);
            await this.delay(attempt * 2000); // Exponential backoff
          }
        }
      } catch (error: any) {
        console.error(`[Browser-Use] Error on attempt ${attempt}:`, error.message);

        if (attempt < maxRetries) {
          await this.delay(attempt * 2000);
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to create ${platform} listing after ${maxRetries} attempts`);
  }

  /**
   * Create a browser automation task for a specific platform
   */
  private async createPlatformListingTask(
    platform: 'craigslist' | 'facebook' | 'ebay',
    product: Product
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Browser-Use API key not configured');
    }

    const instruction = this.buildListingInstruction(platform, product);

    console.log(`[Browser-Use] Sending task to AI: ${instruction.substring(0, 100)}...`);

    const response = await axios.post(
      `${this.baseUrl}/run-task`,
      { task: instruction },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  /**
   * Build natural language instruction for platform listing
   */
  private buildListingInstruction(
    platform: 'craigslist' | 'facebook' | 'ebay',
    product: Product
  ): string {
    const baseInfo = `
Title: "${product.title}"
Price: $${product.targetPrice}
Description: "${product.description}"
Condition: ${product.condition || 'used'}
`.trim();

    switch (platform) {
      case 'craigslist':
        return `
Go to craigslist.org and create a new listing in the electronics or appropriate category.

${baseInfo}

Steps:
1. Navigate to craigslist.org
2. Click "post to classifieds"
3. Select the most appropriate category (electronics, for sale, etc.)
4. Fill in the listing form with the information above
5. Submit the listing
6. Extract and return the final listing URL

Return the listing URL in your response.
`.trim();

      case 'facebook':
        return `
Navigate to Facebook Marketplace and create a new listing.

${baseInfo}

Steps:
1. Go to facebook.com/marketplace
2. Click "Create new listing" or "+ Sell something"
3. Select "Item for sale"
4. Fill in the listing details with the information above
5. Select appropriate category
6. Publish the listing
7. Extract and return the listing URL

Return the marketplace listing URL in your response.
`.trim();

      case 'ebay':
        return `
Go to eBay and list this item for sale.

${baseInfo}

Steps:
1. Navigate to ebay.com
2. Click "Sell" or go to selling center
3. Create a new listing
4. Fill in the item details with the information above
5. Set the listing type (buy it now, auction, etc.)
6. Complete and publish the listing
7. Extract and return the item listing URL

Return the eBay item URL in your response.
`.trim();

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Poll task status until completion
   */
  private async waitForTask(taskId: string, maxWaitMs: number = 90000): Promise<TaskResult> {
    const startTime = Date.now();
    const pollInterval = 3000; // 3 seconds
    let lastStatus = '';

    while (Date.now() - startTime < maxWaitMs) {
      const task = await this.getTaskStatus(taskId);

      if (task.status !== lastStatus) {
        console.log(`[Browser-Use] Task status: ${task.status}`);
        lastStatus = task.status;
      }

      if (task.status === 'finished') {
        return {
          success: true,
          output: task.output || '',
          liveUrl: task.live_url
        };
      }

      if (task.status === 'failed' || task.status === 'error') {
        return {
          success: false,
          error: task.output || 'Task failed without error message'
        };
      }

      // Still running or queued, wait and check again
      await this.delay(pollInterval);
    }

    throw new Error(`Task timeout after ${maxWaitMs}ms`);
  }

  /**
   * Get task status from API
   */
  private async getTaskStatus(taskId: string): Promise<BrowserUseTask> {
    const response = await axios.get(
      `${this.baseUrl}/task/${taskId}`, // Note: singular "task", not "tasks"
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );

    return response.data;
  }

  /**
   * Extract URL from task output text
   */
  private extractUrl(text: string, platform: string): string | null {
    // Try to find URLs in the text
    const urlPatterns = [
      /https?:\/\/[^\s<>"]+/gi,  // General URL pattern
      /craigslist\.org\/[^\s<>"]+/gi,  // Craigslist specific
      /facebook\.com\/marketplace\/[^\s<>"]+/gi,  // Facebook specific
      /ebay\.com\/[^\s<>"]+/gi  // eBay specific
    ];

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first URL that matches the platform
        for (const url of matches) {
          if (url.toLowerCase().includes(platform.toLowerCase())) {
            return url;
          }
        }
        // If no platform-specific URL, return the first URL
        return matches[0];
      }
    }

    return null;
  }

  /**
   * Get fallback URL when listing creation fails
   */
  private getFallbackUrl(platform: 'craigslist' | 'facebook' | 'ebay'): string {
    switch (platform) {
      case 'craigslist':
        return 'https://post.craigslist.org';
      case 'facebook':
        return 'https://www.facebook.com/marketplace/create';
      case 'ebay':
        return 'https://www.ebay.com/sl/sell';
      default:
        return `https://${platform}.com`;
    }
  }

  /**
   * Mark listing as sold (future implementation)
   */
  async markAsSold(listingUrls: string[]): Promise<void> {
    console.log('[Browser-Use] Marking listings as sold...');

    for (const url of listingUrls) {
      try {
        const taskId = await this.createTask(
          `Go to ${url} and mark the listing as sold or remove it`
        );

        const result = await this.waitForTask(taskId, 60000);

        if (result.success) {
          console.log(`[Browser-Use] ✅ Marked as sold: ${url}`);
        } else {
          console.warn(`[Browser-Use] ⚠️  Could not mark as sold: ${url}`);
        }
      } catch (error: any) {
        console.error(`[Browser-Use] ❌ Error marking as sold ${url}:`, error.message);
      }
    }
  }

  /**
   * Update listing price (future implementation)
   */
  async updatePrice(url: string, newPrice: number): Promise<void> {
    try {
      const taskId = await this.createTask(
        `Go to ${url} and update the price to $${newPrice}`
      );

      const result = await this.waitForTask(taskId, 60000);

      if (result.success) {
        console.log(`[Browser-Use] ✅ Price updated to $${newPrice}`);
      } else {
        console.warn(`[Browser-Use] ⚠️  Could not update price`);
      }
    } catch (error: any) {
      console.error(`[Browser-Use] ❌ Error updating price:`, error.message);
    }
  }

  /**
   * Generic task creation helper
   */
  private async createTask(instruction: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Browser-Use API key not configured');
    }

    const response = await axios.post(
      `${this.baseUrl}/run-task`,
      { task: instruction },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.id;
  }

  /**
   * Helper method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
