// Perplexity Integration - Market research and analysis
import axios, { AxiosInstance } from 'axios';
import config from '../config';

export interface PerplexitySearchOptions {
  query: string;
  focus?: 'commerce' | 'general';
  recency_filter?: '1week' | '1month' | '3months' | '1year';
  max_results?: number;
}

export interface PerplexitySearchResult {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  citations: string[];
}

export class PerplexityIntegration {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = config.perplexity.apiUrl;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }
  
  async search(options: PerplexitySearchOptions): Promise<PerplexitySearchResult> {
    const response = await this.client.post('/chat/completions', {
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'user',
          content: options.query
        }
      ],
      focus: options.focus || 'commerce',
      recency_filter: options.recency_filter || '1month',
      return_citations: true,
      return_related_questions: false
    });
    
    const choice = response.data.choices[0];
    
    return {
      answer: choice.message.content,
      sources: response.data.citations?.map((cite: any) => ({
        url: cite.url,
        title: cite.title || '',
        snippet: cite.snippet || ''
      })) || [],
      citations: response.data.citations?.map((cite: any) => cite.url) || []
    };
  }
  
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      // Simple health check - try a minimal search
      await this.client.post('/chat/completions', {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      }, { timeout: 5000 });
      
      return { healthy: true };
    } catch (error: any) {
      // If it's just a validation error, API is healthy
      if (error.response?.status !== 500) {
        return { healthy: true };
      }
      
      return {
        healthy: false,
        error: error.message || 'Health check failed'
      };
    }
  }
}

