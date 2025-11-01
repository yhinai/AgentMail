// OpenAI Integration - GPT-4 wrapper
import OpenAI from 'openai';
import config from '../config';

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}

export class OpenAIIntegration {
  private client: OpenAI;
  private defaultModel: string;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey
    });
    this.defaultModel = config.openai.model;
  }
  
  async chatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: ChatCompletionOptions
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages as any,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      response_format: options?.responseFormat
    });
    
    return response.choices[0].message.content || '';
  }
  
  async jsonCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: Omit<ChatCompletionOptions, 'responseFormat'>
  ): Promise<any> {
    const content = await this.chatCompletion(messages, {
      ...options,
      responseFormat: { type: 'json_object' }
    });
    
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error}`);
    }
  }
  
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      
      return { healthy: true };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message || 'Health check failed'
      };
    }
  }
}

