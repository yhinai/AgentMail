// Hyperspell Integration - Memory management system
import axios, { AxiosInstance } from 'axios';
import config from '../config';

export interface MemoryEntry {
  key: string;
  type: 'seller' | 'product' | 'strategy' | 'pattern';
  category?: string;
  data: any;
  embedding?: number[];
  accessCount?: number;
  lastAccessed?: number;
  confidence?: number;
  source?: string;
  expiresAt?: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filters?: {
    type?: string;
    category?: string;
  };
}

export class HyperspellIntegration {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private namespace: string;
  
  constructor(apiKey: string, namespace?: string) {
    this.apiKey = apiKey;
    this.baseUrl = config.hyperspell.apiUrl;
    this.namespace = namespace || config.hyperspell.namespace;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }
  
  async store(key: string, data: any, options?: {
    type?: string;
    category?: string;
    embedding?: number[];
    confidence?: number;
    expiresAt?: number;
  }): Promise<void> {
    await this.client.post(`/memory/${this.namespace}/store`, {
      key,
      type: options?.type || 'general',
      category: options?.category,
      data,
      embedding: options?.embedding,
      confidence: options?.confidence || 1.0,
      expiresAt: options?.expiresAt
    });
  }
  
  async retrieve(key: string): Promise<MemoryEntry | null> {
    try {
      const response = await this.client.get(`/memory/${this.namespace}/retrieve/${key}`);
      return this.mapToMemoryEntry(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
  
  async search(query: string, options?: SearchOptions): Promise<MemoryEntry[]> {
    const response = await this.client.post(`/memory/${this.namespace}/search`, {
      query,
      limit: options?.limit || 10,
      threshold: options?.threshold || 0.7,
      filters: options?.filters
    });
    
    return response.data.results.map((item: any) => this.mapToMemoryEntry(item));
  }
  
  async update(key: string, data: Partial<MemoryEntry>): Promise<void> {
    await this.client.put(`/memory/${this.namespace}/update/${key}`, data);
  }
  
  async delete(key: string): Promise<void> {
    await this.client.delete(`/memory/${this.namespace}/delete/${key}`);
  }
  
  async incrementAccess(key: string): Promise<void> {
    await this.client.post(`/memory/${this.namespace}/access/${key}`);
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
  
  private mapToMemoryEntry(data: any): MemoryEntry {
    return {
      key: data.key,
      type: data.type,
      category: data.category,
      data: data.data,
      embedding: data.embedding,
      accessCount: data.accessCount || 0,
      lastAccessed: data.lastAccessed ? new Date(data.lastAccessed).getTime() : Date.now(),
      confidence: data.confidence || 1.0,
      source: data.source,
      expiresAt: data.expiresAt
    };
  }
}

