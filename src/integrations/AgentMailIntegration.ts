// AgentMail Integration - Full SDK wrapper
import axios, { AxiosInstance } from 'axios';
import { EmailMessage, EmailContent, IncomingEmail } from '../types';
import config from '../config';

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  threadId?: string;
  scheduleSend?: number;
  trackingSettings?: {
    opens: boolean;
    clicks: boolean;
    unsubscribe: boolean;
  };
}

export interface EmailResult {
  messageId: string;
  threadId?: string;
  success: boolean;
  timestamp: Date;
}

export interface EmailThread {
  threadId: string;
  messages: EmailMessage[];
}

interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
}

export class AgentMailIntegration {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private webhookHandler?: any;
  private retryConfig: RetryConfig;
  
  constructor(apiConfig: {
    apiKey: string;
    webhookUrl?: string;
    retryConfig?: RetryConfig;
  }) {
    this.apiKey = apiConfig.apiKey;
    this.baseUrl = config.agentMail.apiUrl;
    this.retryConfig = apiConfig.retryConfig || {
      maxAttempts: 3,
      backoffMs: 1000
    };
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }
  
  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    return await this.withRetry(async () => {
      const response = await this.client.post('/messages/send', {
        to: params.to,
        from: params.from || config.agentMail.fromEmail,
        subject: params.subject,
        html: params.html,
        text: params.text || params.html?.replace(/<[^>]*>/g, ''),
        threadId: params.threadId,
        headers: params.headers,
        attachments: params.attachments?.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          content: att.content.toString('base64')
        })),
        scheduleSend: params.scheduleSend,
        trackingSettings: params.trackingSettings || {
          opens: true,
          clicks: true,
          unsubscribe: false
        }
      });
      
      const result: EmailResult = {
        messageId: response.data.messageId || response.data.id,
        threadId: response.data.threadId || params.threadId,
        success: true,
        timestamp: new Date()
      };
      
      // Store in database (optional)
      await this.storeEmailRecord(result);
      
      return result;
    });
  }
  
  async replyToEmail(threadId: string, content: EmailContent, headers?: Record<string, string>): Promise<EmailResult> {
    return await this.withRetry(async () => {
      const response = await this.client.post(`/threads/${threadId}/reply`, {
        ...content,
        headers
      });
      
      return {
        messageId: response.data.messageId || response.data.id,
        threadId: threadId,
        success: true,
        timestamp: new Date()
      };
    });
  }
  
  async getThreadHistory(threadId: string): Promise<EmailThread> {
    const response = await this.client.get(`/threads/${threadId}`);
    
    return {
      threadId,
      messages: response.data.messages.map((msg: any) => this.mapToEmailMessage(msg))
    };
  }
  
  async getUnreadMessages(): Promise<EmailMessage[]> {
    const response = await this.client.get('/messages/unread');
    
    return response.data.messages.map((msg: any) => this.mapToEmailMessage(msg));
  }
  
  async markAsRead(messageId: string): Promise<void> {
    await this.client.post(`/messages/${messageId}/read`);
  }
  
  async handleEmailOpened(data: any): Promise<void> {
    // Handle email opened webhook
    console.log('Email opened:', data);
  }
  
  async handleEmailClicked(data: any): Promise<void> {
    // Handle email clicked webhook
    console.log('Email clicked:', data);
  }
  
  async handleEmailBounced(data: any): Promise<void> {
    // Handle email bounced webhook
    console.error('Email bounced:', data);
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
  
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.retryConfig.backoffMs * attempt;
          await this.delay(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private mapToEmailMessage(msg: any): EmailMessage {
    return {
      id: msg.id || msg.messageId,
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      body: msg.body || msg.text || msg.html || '',
      html: msg.html,
      threadId: msg.threadId,
      messageId: msg.messageId || msg.id,
      timestamp: new Date(msg.timestamp || msg.createdAt),
      attachments: msg.attachments?.map((att: any) => ({
        filename: att.filename,
        contentType: att.contentType,
        content: Buffer.from(att.content || att.data, att.encoding || 'base64')
      }))
    };
  }
  
  private async storeEmailRecord(result: EmailResult): Promise<void> {
    // Optional: Store in database
    // This could integrate with Convex or other storage
  }
}

