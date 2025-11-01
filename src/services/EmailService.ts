/**
 * Email Service
 * High-level email operations with queue management and error handling
 */

import { AgentMailClient, Inbox, Message, Thread } from './AgentMailClient';
import { EventEmitter } from 'events';
import { DatabaseClient } from '../database/client';

export interface EmailQueueItem {
  id: string;
  messageId: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
  error?: string;
  metadata?: {
    intent?: string;
    sentiment?: string;
    urgency?: string;
  };
}

export interface EmailActivity {
  id: string;
  type: 'received' | 'sent' | 'analyzed' | 'error';
  from: string;
  to: string;
  subject: string;
  summary: string;
  timestamp: Date;
  metadata?: any;
}

export class EmailService extends EventEmitter {
  private client: AgentMailClient;
  private db: DatabaseClient;
  private inbox?: Inbox;
  private queue: Map<string, EmailQueueItem> = new Map();
  private activityLog: EmailActivity[] = [];
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private pollingInterval?: NodeJS.Timeout;
  private seenMessageIds: Set<string> = new Set();

  constructor(apiKey?: string, baseURL?: string) {
    super();
    this.client = new AgentMailClient(apiKey, baseURL);
    this.db = new DatabaseClient();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async initialize(inboxName: string = 'ProfitPilot Sales'): Promise<Inbox> {
    console.log('🚀 Initializing Email Service...');

    // Health check
    const isHealthy = await this.client.healthCheck();
    if (!isHealthy) {
      throw new Error('AgentMail API is not accessible');
    }

    // Get or create inbox
    this.inbox = await this.client.getOrCreateDefaultInbox(inboxName);
    const emailAddress = this.inbox.email || this.inbox.inbox_id;
    console.log(`✅ Email Service initialized with inbox: ${emailAddress}`);

    return this.inbox;
  }

  async setupWebhook(callbackUrl: string): Promise<void> {
    await this.client.setupWebhook(callbackUrl);
  }

  getInbox(): Inbox | undefined {
    return this.inbox;
  }

  // ============================================
  // EMAIL QUEUE MANAGEMENT
  // ============================================

  /**
   * Add email to processing queue
   */
  queueEmail(email: Omit<EmailQueueItem, 'id' | 'status' | 'retryCount'>): string {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: EmailQueueItem = {
      id,
      ...email,
      status: 'pending',
      retryCount: 0,
    };

    this.queue.set(id, queueItem);

    // Write to Convex database
    this.db.queueEmail({
      messageId: email.messageId,
      threadId: email.threadId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body,
      priority: email.priority,
    }).catch(err => console.warn('⚠️  Failed to queue email in DB:', err.message));

    // Log activity
    this.logActivity({
      type: 'received',
      from: email.from,
      to: email.to,
      subject: email.subject,
      summary: `Email received and queued for processing`,
    });

    // Emit event
    this.emit('email:queued', queueItem);

    console.log(`📬 Email queued: ${email.subject} (from: ${email.from})`);
    return id;
  }

  /**
   * Process incoming webhook email
   */
  handleWebhookEmail(webhookData: any): string {
    const { message, inbox_id } = webhookData;

    return this.queueEmail({
      messageId: message.message_id,
      threadId: message.thread_id,
      from: message.from,
      to: message.to?.[0] || this.inbox?.email || '',
      subject: message.subject,
      body: message.body,
      receivedAt: new Date(message.created_at),
      priority: 'medium',
    });
  }

  /**
   * Get pending emails from queue
   */
  getPendingEmails(limit: number = 10): EmailQueueItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // Priority: high > medium > low
        const priorityMap = { high: 3, medium: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      })
      .slice(0, limit);
  }

  /**
   * Update email status in queue
   */
  updateEmailStatus(
    emailId: string,
    status: EmailQueueItem['status'],
    error?: string,
    metadata?: EmailQueueItem['metadata']
  ): void {
    const item = this.queue.get(emailId);
    if (!item) return;

    item.status = status;
    if (error) item.error = error;
    if (metadata) item.metadata = { ...item.metadata, ...metadata };

    this.queue.set(emailId, item);
    this.emit('email:status', { emailId, status, error, metadata });

    if (status === 'failed') {
      this.logActivity({
        type: 'error',
        from: item.from,
        to: item.to,
        subject: item.subject,
        summary: `Email processing failed: ${error}`,
      });
    } else if (status === 'completed') {
      this.logActivity({
        type: 'analyzed',
        from: item.from,
        to: item.to,
        subject: item.subject,
        summary: `Email processed successfully`,
        metadata: item.metadata,
      });
    }
  }

  /**
   * Retry failed email
   */
  retryEmail(emailId: string): void {
    const item = this.queue.get(emailId);
    if (!item) return;

    if (item.retryCount >= 3) {
      console.warn(`⚠️  Max retries reached for email: ${emailId}`);
      return;
    }

    item.retryCount++;
    item.status = 'pending';
    item.error = undefined;

    this.queue.set(emailId, item);
    this.emit('email:retry', item);

    console.log(`🔄 Retrying email (attempt ${item.retryCount}): ${item.subject}`);
  }

  // ============================================
  // EMAIL OPERATIONS
  // ============================================

  /**
   * Send an email
   */
  async sendEmail(to: string[], subject: string, body: string, html?: string): Promise<Message> {
    if (!this.inbox) {
      throw new Error('Email service not initialized');
    }

    console.log(`📤 Sending email to ${to.join(', ')}: ${subject}`);

    try {
      const message = await this.client.sendMessage(
        this.inbox.inbox_id,
        to,
        subject,
        body,
        html
      );

      // Log activity
      this.logActivity({
        type: 'sent',
        from: this.inbox.email,
        to: to.join(', '),
        subject,
        summary: `Email sent successfully`,
      });

      this.emit('email:sent', message);
      console.log(`✅ Email sent: ${message.message_id}`);

      return message;
    } catch (error: any) {
      console.error(`❌ Failed to send email:`, error.message);

      this.logActivity({
        type: 'error',
        from: this.inbox.email,
        to: to.join(', '),
        subject,
        summary: `Failed to send email: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * Reply to an email thread
   */
  async replyToThread(threadId: string, body: string, html?: string): Promise<Message> {
    if (!this.inbox) {
      throw new Error('Email service not initialized');
    }

    console.log(`💬 Replying to thread: ${threadId}`);

    try {
      const message = await this.client.replyToMessage(
        this.inbox.inbox_id,
        threadId,
        body,
        html
      );

      this.emit('email:reply', message);
      console.log(`✅ Reply sent: ${message.message_id}`);

      return message;
    } catch (error: any) {
      console.error(`❌ Failed to reply:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch recent messages
   */
  async fetchRecentMessages(limit: number = 50): Promise<Message[]> {
    if (!this.inbox) {
      throw new Error('Email service not initialized');
    }

    const messages = await this.client.listMessages(this.inbox.inbox_id, limit);
    console.log(`📥 Fetched ${messages.length} messages`);

    return messages;
  }

  /**
   * Get thread details with all messages
   */
  async getThreadDetails(threadId: string): Promise<{ thread: Thread; messages: Message[] }> {
    if (!this.inbox) {
      throw new Error('Email service not initialized');
    }

    const [thread, messages] = await Promise.all([
      this.client.getThread(this.inbox.inbox_id, threadId),
      this.client.getThreadMessages(this.inbox.inbox_id, threadId),
    ]);

    return { thread, messages };
  }

  // ============================================
  // ACTIVITY LOG
  // ============================================

  private logActivity(activity: Omit<EmailActivity, 'id' | 'timestamp'>): void {
    const activityItem: EmailActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...activity,
      timestamp: new Date(),
    };

    this.activityLog.unshift(activityItem);

    // Keep only last 100 activities in memory
    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(0, 100);
    }

    // Write to Convex database
    this.db.logActivity({
      emailId: activityItem.id,
      type: activity.type,
      from: activity.from,
      to: activity.to,
      subject: activity.subject,
      summary: activity.summary,
      metadata: activity.metadata,
    }).catch(err => console.warn('⚠️  Failed to log activity in DB:', err.message));

    this.emit('activity:logged', activityItem);
  }

  getRecentActivity(limit: number = 50): EmailActivity[] {
    return this.activityLog.slice(0, limit);
  }

  // ============================================
  // BACKGROUND PROCESSING
  // ============================================

  /**
   * Start processing queue in background
   */
  startProcessing(intervalMs: number = 5000): void {
    if (this.isProcessing) {
      console.log('⚠️  Email processing already started');
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Starting email queue processing...');

    this.processingInterval = setInterval(async () => {
      const pending = this.getPendingEmails(5);

      for (const email of pending) {
        this.emit('email:process', email);
      }
    }, intervalMs);
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    this.isProcessing = false;
    console.log('⏸️  Email queue processing stopped');
  }

  /**
   * Start polling for new emails from AgentMail
   */
  startPolling(intervalMs: number = 30000): void {
    if (!this.inbox) {
      console.warn('⚠️  Cannot start polling: inbox not initialized');
      return;
    }

    if (this.pollingInterval) {
      console.log('⚠️  Email polling already started');
      return;
    }

    console.log(`📬 Starting email polling (interval: ${intervalMs / 1000}s)...`);

    // Immediate first poll
    this.pollForNewEmails();

    // Then poll periodically
    this.pollingInterval = setInterval(async () => {
      await this.pollForNewEmails();
    }, intervalMs);
  }

  /**
   * Poll for new emails from AgentMail
   */
  private async pollForNewEmails(): Promise<void> {
    if (!this.inbox) return;

    try {
      const messages = await this.client.listMessages(this.inbox.inbox_id, 20);

      let newCount = 0;
      for (const messagePreview of messages) {
        // Skip if we've already seen this message
        if (this.seenMessageIds.has(messagePreview.message_id)) {
          console.log(`⏭️  Skipping already seen message: ${messagePreview.message_id}`);
          continue;
        }

        // Skip emails from ourselves to avoid feedback loops
        if (messagePreview.from === this.inbox.email ||
            messagePreview.from.includes(this.inbox.inbox_id) ||
            messagePreview.from.includes(this.inbox.email)) {
          console.log(`⏭️  Skipping email from self: ${messagePreview.from}`);
          this.seenMessageIds.add(messagePreview.message_id);
          continue;
        }

        console.log(`🆕 New message ID: ${messagePreview.message_id} (total seen: ${this.seenMessageIds.size})`);

        // Fetch full message details
        const message = await this.client.getMessage(this.inbox.inbox_id, messagePreview.message_id);

        // Mark as seen
        this.seenMessageIds.add(message.message_id);
        newCount++;

        // Queue for processing
        this.queueEmail({
          messageId: message.message_id,
          threadId: message.thread_id,
          from: message.from,
          to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
          subject: message.subject || '(no subject)',
          body: message.body || '',
          receivedAt: new Date(),
          priority: 'medium',
        });

        console.log(`📧 New email received: "${message.subject}" from ${message.from}`);
      }

      if (newCount > 0) {
        console.log(`✅ Fetched ${newCount} new email(s)`);
      }
    } catch (error: any) {
      console.error('❌ Error polling for emails:', error.message);
    }
  }

  /**
   * Stop polling for new emails
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
      console.log('⏸️  Email polling stopped');
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  getQueueStats() {
    const items = Array.from(this.queue.values());

    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      processing: items.filter(i => i.status === 'processing').length,
      completed: items.filter(i => i.status === 'completed').length,
      failed: items.filter(i => i.status === 'failed').length,
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Email Service...');
    this.stopProcessing();
    this.stopPolling();
    this.queue.clear();
    this.activityLog = [];
    this.removeAllListeners();
  }
}
