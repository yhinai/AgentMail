/**
 * AgentMail API Client
 * Low-level wrapper around the AgentMail REST API
 */

import axios, { AxiosInstance } from 'axios';

export interface Inbox {
  inbox_id: string;
  pod_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  inbox_id: string;
  thread_id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  html?: string;
  created_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  content_type: string;
  size: number;
  url: string;
}

export interface Thread {
  thread_id: string;
  inbox_id: string;
  subject: string;
  participants: string[];
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface Webhook {
  webhook_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

export interface Pod {
  pod_id: string;
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export class AgentMailClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.AGENTMAIL_API_KEY || '';
    this.baseURL = baseURL || process.env.AGENTMAIL_API_URL || 'https://api.agentmail.to/v0';

    if (!this.apiKey) {
      console.warn('⚠️  AgentMail API key not configured. Some features may not work.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // ============================================
  // PODS
  // ============================================

  async listPods(): Promise<Pod[]> {
    const response = await this.client.get('/pods');
    return response.data.pods || [];
  }

  async getDefaultPod(): Promise<Pod | null> {
    const pods = await this.listPods();
    return pods.length > 0 ? pods[0] : null;
  }

  // ============================================
  // INBOXES
  // ============================================

  async listInboxes(podId?: string): Promise<Inbox[]> {
    const endpoint = podId ? `/pods/${podId}/inboxes` : '/inboxes';
    const response = await this.client.get(endpoint);
    return response.data.inboxes || [];
  }

  async getInbox(inboxId: string): Promise<Inbox> {
    const response = await this.client.get(`/inboxes/${inboxId}`);
    return response.data;
  }

  async createInbox(podId: string, name: string): Promise<Inbox> {
    const response = await this.client.post(`/pods/${podId}/inboxes`, {
      name,
    });
    return response.data;
  }

  async deleteInbox(inboxId: string): Promise<void> {
    await this.client.delete(`/inboxes/${inboxId}`);
  }

  // ============================================
  // MESSAGES
  // ============================================

  async listMessages(inboxId: string, limit: number = 50): Promise<Message[]> {
    const response = await this.client.get(`/inboxes/${inboxId}/messages`, {
      params: { limit },
    });
    return response.data.messages || [];
  }

  async getMessage(inboxId: string, messageId: string): Promise<Message> {
    const response = await this.client.get(`/inboxes/${inboxId}/messages/${messageId}`);
    return response.data;
  }

  async sendMessage(inboxId: string, to: string[], subject: string, body: string, html?: string): Promise<Message> {
    const response = await this.client.post(`/inboxes/${inboxId}/messages`, {
      to,
      subject,
      body,
      html,
    });
    return response.data;
  }

  async replyToMessage(inboxId: string, threadId: string, body: string, html?: string): Promise<Message> {
    const response = await this.client.post(`/inboxes/${inboxId}/threads/${threadId}/reply`, {
      body,
      html,
    });
    return response.data;
  }

  // ============================================
  // THREADS
  // ============================================

  async listThreads(inboxId: string, limit: number = 50): Promise<Thread[]> {
    const response = await this.client.get(`/inboxes/${inboxId}/threads`, {
      params: { limit },
    });
    return response.data.threads || [];
  }

  async getThread(inboxId: string, threadId: string): Promise<Thread> {
    const response = await this.client.get(`/inboxes/${inboxId}/threads/${threadId}`);
    return response.data;
  }

  async getThreadMessages(inboxId: string, threadId: string): Promise<Message[]> {
    const response = await this.client.get(`/inboxes/${inboxId}/threads/${threadId}/messages`);
    return response.data.messages || [];
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  async listWebhooks(): Promise<Webhook[]> {
    const response = await this.client.get('/webhooks');
    return response.data.webhooks || [];
  }

  async createWebhook(url: string, events: string[]): Promise<Webhook> {
    const response = await this.client.post('/webhooks', {
      url,
      events,
    });
    return response.data;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.delete(`/webhooks/${webhookId}`);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get or create a default inbox for the application
   */
  async getOrCreateDefaultInbox(name: string = 'ProfitPilot Sales'): Promise<Inbox> {
    // Check for existing inboxes
    const inboxes = await this.listInboxes();
    if (inboxes.length > 0) {
      const emailAddress = inboxes[0].email || inboxes[0].inbox_id;
      console.log(`✅ Using existing inbox: ${emailAddress}`);
      return inboxes[0];
    }

    // Get default pod
    const pod = await this.getDefaultPod();
    if (!pod) {
      throw new Error('No default pod found. Please create a pod first.');
    }

    // Create new inbox
    console.log(`📧 Creating new inbox: ${name}`);
    const inbox = await this.createInbox(pod.pod_id, name);
    const emailAddress = inbox.email || inbox.inbox_id;
    console.log(`✅ Inbox created: ${emailAddress}`);
    return inbox;
  }

  /**
   * Setup webhook for real-time email notifications
   */
  async setupWebhook(callbackUrl: string): Promise<Webhook> {
    // Check for existing webhooks
    const webhooks = await this.listWebhooks();
    const existingWebhook = webhooks.find(w => w.url === callbackUrl);

    if (existingWebhook) {
      console.log(`✅ Webhook already exists: ${callbackUrl}`);
      return existingWebhook;
    }

    // Create new webhook
    console.log(`🔗 Creating webhook: ${callbackUrl}`);
    const webhook = await this.createWebhook(callbackUrl, [
      'message.received',
      'message.sent',
      'message.delivered',
      'message.bounced',
    ]);
    console.log(`✅ Webhook created`);
    return webhook;
  }

  /**
   * Check if API is connected and working
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.listPods();
      return true;
    } catch (error) {
      console.error('AgentMail API health check failed:', error);
      return false;
    }
  }
}
