// @ts-nocheck - TODO: Fix SDK type mismatches after agentmail package update
/**
 * AgentMail API Client
 * Wrapper around the official AgentMail SDK
 */

import { AgentMailClient as OfficialAgentMailClient } from 'agentmail';

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
  private client: OfficialAgentMailClient;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AGENTMAIL_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️  AgentMail API key not configured. Some features may not work.');
    }

    // Initialize official SDK
    this.client = new OfficialAgentMailClient({
      apiKey: this.apiKey,
    });
  }

  // ============================================
  // PODS
  // ============================================

  async listPods(): Promise<Pod[]> {
    const response = await this.client.pods.list();
    return (response.pods || []).map(pod => ({
      pod_id: pod.podId,
      organization_id: pod.organizationId,
      name: pod.displayName || pod.podId,
      created_at: pod.createdAt || new Date().toISOString(),
      updated_at: pod.updatedAt || new Date().toISOString(),
    }));
  }

  async getDefaultPod(): Promise<Pod | null> {
    const pods = await this.listPods();
    return pods.length > 0 ? pods[0] : null;
  }

  // ============================================
  // INBOXES
  // ============================================

  async listInboxes(podId?: string): Promise<Inbox[]> {
    const response = await this.client.inboxes.list();
    const inboxes = (response.inboxes || []).map(inbox => ({
      inbox_id: inbox.inboxId,
      pod_id: inbox.podId,
      email: inbox.email || inbox.inboxId,
      name: inbox.displayName || inbox.email || inbox.inboxId,
      created_at: inbox.createdAt || new Date().toISOString(),
      updated_at: inbox.updatedAt || new Date().toISOString(),
    }));

    // Filter by podId if provided
    if (podId) {
      return inboxes.filter(inbox => inbox.pod_id === podId);
    }

    return inboxes;
  }

  async getInbox(inboxId: string): Promise<Inbox> {
    const response = await this.client.inboxes.get(inboxId);
    return {
      inbox_id: response.inboxId,
      pod_id: response.podId,
      email: response.email || response.inboxId,
      name: response.displayName || response.email || response.inboxId,
      created_at: response.createdAt || new Date().toISOString(),
      updated_at: response.updatedAt || new Date().toISOString(),
    };
  }

  async createInbox(podId: string, name: string): Promise<Inbox> {
    // Note: SDK creates inboxes differently - check SDK docs for exact params
    const response = await this.client.inboxes.create({
      displayName: name,
    });
    return {
      inbox_id: response.inboxId,
      pod_id: response.podId,
      email: response.email || response.inboxId,
      name: response.displayName || name,
      created_at: response.createdAt || new Date().toISOString(),
      updated_at: response.updatedAt || new Date().toISOString(),
    };
  }

  async deleteInbox(inboxId: string): Promise<void> {
    await this.client.inboxes.delete(inboxId);
  }

  // ============================================
  // MESSAGES
  // ============================================

  async listMessages(inboxId: string, limit: number = 50): Promise<Message[]> {
    const response = await this.client.inboxes.messages.list(inboxId, { limit });
    return (response.messages || []).map(msg => ({
      message_id: msg.messageId,
      inbox_id: inboxId,
      thread_id: msg.threadId,
      from: msg.from,
      to: msg.to || [],
      subject: msg.subject || '',
      body: msg.text || '',
      html: msg.html,
      created_at: msg.createdAt || new Date().toISOString(),
      attachments: (msg.attachments || []).map(att => ({
        filename: att.filename || 'attachment',
        content_type: att.contentType || 'application/octet-stream',
        size: att.size || 0,
        url: att.url || '',
      })),
    }));
  }

  async getMessage(inboxId: string, messageId: string): Promise<Message> {
    const response = await this.client.inboxes.messages.get(inboxId, messageId);
    return {
      message_id: response.messageId,
      inbox_id: inboxId,
      thread_id: response.threadId,
      from: response.from,
      to: response.to || [],
      subject: response.subject || '',
      body: response.text || '',
      html: response.html,
      created_at: response.createdAt || new Date().toISOString(),
      attachments: (response.attachments || []).map(att => ({
        filename: att.filename || 'attachment',
        content_type: att.contentType || 'application/octet-stream',
        size: att.size || 0,
        url: att.url || '',
      })),
    };
  }

  async sendMessage(inboxId: string, to: string[], subject: string, body: string, html?: string): Promise<Message> {
    // Use official SDK for sending messages
    const response = await this.client.inboxes.messages.send(inboxId, {
      to,
      subject,
      text: body,
      html,
    });

    // Get inbox info to determine the from address
    const inbox = await this.getInbox(inboxId);

    // Convert official SDK response to our Message format
    return {
      message_id: response.messageId,
      inbox_id: inboxId,
      thread_id: response.threadId,
      from: inbox.email,
      to: to,
      subject: subject,
      body: body,
      html: html,
      created_at: new Date().toISOString(),
    };
  }

  async replyToMessage(inboxId: string, messageId: string, body: string, html?: string): Promise<Message> {
    // Use official SDK for replying to messages
    const response = await this.client.inboxes.messages.reply(
      inboxId,
      messageId,
      {
        text: body,
        html,
      }
    );

    // Get inbox info to determine the from address
    const inbox = await this.getInbox(inboxId);

    // Convert official SDK response to our Message format
    return {
      message_id: response.messageId,
      inbox_id: inboxId,
      thread_id: response.threadId,
      from: inbox.email,
      to: [], // Reply recipients are inferred from the thread
      subject: '', // Subject is inherited from thread
      body: body,
      html: html,
      created_at: new Date().toISOString(),
    };
  }

  // ============================================
  // THREADS
  // ============================================

  async listThreads(inboxId: string, limit: number = 50): Promise<Thread[]> {
    const response = await this.client.inboxes.threads.list(inboxId, { limit });
    return (response.threads || []).map(thread => ({
      thread_id: thread.threadId,
      inbox_id: inboxId,
      subject: thread.subject || '',
      participants: thread.participants || [],
      message_count: thread.messageCount || 0,
      last_message_at: thread.lastMessageAt || new Date().toISOString(),
      created_at: thread.createdAt || new Date().toISOString(),
    }));
  }

  async getThread(inboxId: string, threadId: string): Promise<Thread> {
    const response = await this.client.inboxes.threads.get(inboxId, threadId);
    return {
      thread_id: response.threadId,
      inbox_id: inboxId,
      subject: response.subject || '',
      participants: response.participants || [],
      message_count: response.messageCount || 0,
      last_message_at: response.lastMessageAt || new Date().toISOString(),
      created_at: response.createdAt || new Date().toISOString(),
    };
  }

  async getThreadMessages(inboxId: string, threadId: string): Promise<Message[]> {
    // SDK doesn't have a direct getThreadMessages method
    // We can get the thread and then list messages filtered by thread_id
    // Or we can use listMessages and filter client-side
    const allMessages = await this.listMessages(inboxId, 100);
    return allMessages.filter(msg => msg.thread_id === threadId);
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  async listWebhooks(): Promise<Webhook[]> {
    const response = await this.client.webhooks.list();
    return (response.webhooks || []).map(webhook => ({
      webhook_id: webhook.webhookId,
      url: webhook.url,
      events: webhook.eventTypes || [],
      active: webhook.status === 'active',
      created_at: webhook.createdAt || new Date().toISOString(),
    }));
  }

  async createWebhook(url: string, events: string[]): Promise<Webhook> {
    const response = await this.client.webhooks.create({
      url,
      eventTypes: events,
    });
    return {
      webhook_id: response.webhookId,
      url: response.url,
      events: response.eventTypes || [],
      active: response.status === 'active',
      created_at: response.createdAt || new Date().toISOString(),
    };
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.client.webhooks.delete(webhookId);
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
