import { BrowserUseClient, BrowserSession } from './browserUseClient';
import { Product, ListingPlatform, ListingResults } from '../types';
import { Logger } from '../utils/logger';
import { retry } from '../utils/retry';
import { RateLimiter } from '../utils/rateLimiter';

export class BrowserAgent {
  private browser: BrowserUseClient;
  private platforms: ListingPlatform[] = ['craigslist', 'facebook', 'ebay'];
  private rateLimiter: RateLimiter;

  constructor(browserClient: BrowserUseClient) {
    this.browser = browserClient;
    // Rate limit: 10 requests per minute per platform
    this.rateLimiter = new RateLimiter(10, 60000);
  }

  async createListings(product: Product): Promise<ListingResults> {
    Logger.info(`Creating listings for product: ${product.title}`);

    const results: ListingResults = {
      success: [],
      failed: [],
      urls: {} as Record<ListingPlatform, string>,
      errors: {},
    };

    for (const platform of this.platforms) {
      try {
        await this.rateLimiter.waitIfNeeded(platform);

        const url = await retry(
          () => this.createListing(platform, product),
          {
            maxAttempts: 3,
            delay: 2000,
            exponentialBackoff: true,
            maxDelay: 30000,
          }
        );

        results.success.push(platform);
        results.urls[platform] = url;
        Logger.info(`Listing created on ${platform}: ${url}`);
      } catch (error) {
        results.failed.push(platform);
        results.errors = results.errors || {};
        results.errors[platform] =
          error instanceof Error ? error.message : 'Unknown error';
        Logger.error(`Failed to create listing on ${platform}`, error);
      }
    }

    return results;
  }

  private async createListing(
    platform: ListingPlatform,
    product: Product
  ): Promise<string> {
    Logger.debug(`Creating listing on ${platform}`);

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

  private async createCraigslistListing(
    product: Product
  ): Promise<string> {
    const session = await this.browser.newSession();

    try {
      await session.navigate('https://craigslist.org');
      await session.click('a[href*="post"]'); // Post to classifieds
      await session.waitFor('#PostingTitle');

      await session.fill('#PostingTitle', product.title);
      await session.fill('#PostingBody', product.description);
      await session.fill('#Ask', product.price.toString());

      // Select category (for sale)
      await session.select('#category', 'sso');

      // Submit
      await session.click('button[type="submit"]');
      await session.waitFor('.posting');

      const url = await session.getCurrentUrl();
      return url;
    } finally {
      await session.close();
    }
  }

  private async createFacebookListing(
    product: Product
  ): Promise<string> {
    const session = await this.browser.newSession();

    try {
      await session.navigate('https://www.facebook.com/marketplace/create/item');
      
      // Wait for form
      await session.waitFor('[aria-label*="Title"]');

      await session.fill('[aria-label*="Title"]', product.title);
      await session.fill('[aria-label*="Price"]', product.price.toString());
      await session.fill('[aria-label*="Description"]', product.description);

      // Select condition
      await session.click('[aria-label*="Condition"]');
      await session.click(`[role="option"][aria-label*="${product.condition}"]`);

      // Category (optional - skip for demo)
      
      // Publish
      await session.click('[aria-label*="Publish"]');
      await session.waitFor('[aria-label*="Your listing is live"]');

      const url = await session.getCurrentUrl();
      return url;
    } finally {
      await session.close();
    }
  }

  private async createEbayListing(
    product: Product
  ): Promise<string> {
    const session = await this.browser.newSession();

    try {
      await session.navigate('https://www.ebay.com/sl/sell');
      await session.click('a[href*="list"]'); // Start listing

      // Wait for form
      await session.waitFor('#Title');

      await session.fill('#Title', product.title);
      await session.fill('#Description', product.description);
      await session.fill('#Price', product.price.toString());

      // Condition
      await session.select('#Condition', this.mapConditionToEbay(product.condition));

      // Submit
      await session.click('button[data-test-id="Review-button"]');
      await session.waitFor('[data-test-id="publish-button"]');
      await session.click('[data-test-id="publish-button"]');

      await session.waitFor('.listing-success');
      const url = await session.getCurrentUrl();
      return url;
    } finally {
      await session.close();
    }
  }

  private mapConditionToEbay(
    condition: Product['condition']
  ): string {
    const mapping: Record<Product['condition'], string> = {
      new: '1000',
      'like-new': '2750',
      used: '3000',
      refurbished: '2000',
    };
    return mapping[condition] || '3000';
  }

  async updatePrice(
    listingUrl: string,
    platform: ListingPlatform,
    newPrice: number
  ): Promise<void> {
    Logger.info(`Updating price on ${platform} to $${newPrice}`);

    await this.rateLimiter.waitIfNeeded(platform);

    const session = await this.browser.newSession();

    try {
      await session.navigate(listingUrl);

      // Navigate to edit
      await session.click('a[href*="edit"], button[aria-label*="Edit"]');
      await session.waitFor('input[name*="price"], #Price');

      // Update price
      await session.fill('input[name*="price"], #Price', newPrice.toString());

      // Save
      await session.click('button[type="submit"], button[aria-label*="Save"]');
      await session.waitFor('.success, .confirmation');

      Logger.info(`Price updated successfully on ${platform}`);
    } finally {
      await session.close();
    }
  }

  async markAsSold(
    listingUrls: Record<string, string>
  ): Promise<void> {
    Logger.info('Marking listings as sold');

    for (const [platform, url] of Object.entries(listingUrls)) {
      try {
        await this.rateLimiter.waitIfNeeded(platform);

        const session = await this.browser.newSession();

        try {
          await session.navigate(url);
          
          // Click mark as sold
          await session.click(
            'button[aria-label*="Sold"], a[href*="sold"], button:has-text("Mark as sold")'
          );

          // Confirm if needed
          await session.waitFor('.confirmation', 3000).catch(() => {
            // No confirmation needed
          });
          await session.click('button:has-text("Confirm"), button[aria-label*="Confirm"]')
            .catch(() => {
              // No confirmation button
            });

          Logger.info(`Marked as sold on ${platform}`);
        } finally {
          await session.close();
        }
      } catch (error) {
        Logger.error(`Failed to mark as sold on ${platform}`, error);
      }
    }
  }

  async checkInventoryStatus(
    listingUrls: Record<string, string>
  ): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    for (const [platform, url] of Object.entries(listingUrls)) {
      try {
        const session = await this.browser.newSession();

        try {
          await session.navigate(url);
          
          // Check if listing still exists and is active
          const exists = await session.waitFor('.listing, .active', 5000)
            .then(() => true)
            .catch(() => false);

          status[platform] = exists;
        } finally {
          await session.close();
        }
      } catch (error) {
        Logger.error(`Error checking status on ${platform}`, error);
        status[platform] = false;
      }
    }

    return status;
  }
}

