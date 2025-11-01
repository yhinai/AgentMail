// Composio Integration - Marketplace API integrations
import axios, { AxiosInstance } from 'axios';
import config from '../config';

export interface MarketplaceListing {
  platform: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category?: string;
  condition?: string;
}

export interface ListingResult {
  success: boolean;
  listingId?: string;
  url?: string;
  error?: string;
}

export class ComposioIntegration {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = config.composio.apiUrl;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });
  }
  
  async createListing(
    platform: string,
    listing: MarketplaceListing
  ): Promise<ListingResult> {
    try {
      const response = await this.client.post(`/integrations/${platform}/listings`, {
        ...listing,
        platform
      });
      
      return {
        success: true,
        listingId: response.data.listingId || response.data.id,
        url: response.data.url
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  async updateListing(
    platform: string,
    listingId: string,
    updates: Partial<MarketplaceListing>
  ): Promise<ListingResult> {
    try {
      const response = await this.client.put(
        `/integrations/${platform}/listings/${listingId}`,
        updates
      );
      
      return {
        success: true,
        listingId,
        url: response.data.url
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  async deleteListing(platform: string, listingId: string): Promise<boolean> {
    try {
      await this.client.delete(`/integrations/${platform}/listings/${listingId}`);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return { healthy: true };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message || 'Health check failed'
      };
    }
  }
}

