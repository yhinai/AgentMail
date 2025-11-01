// Convex functions for email queue management
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Add an email to the processing queue
 */
export const queueEmail = mutation({
  args: {
    messageId: v.string(),
    threadId: v.optional(v.string()),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    receivedAt: v.number(),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if email already queued
    const existing = await ctx.db
      .query('emailQueue')
      .withIndex('by_message_id', (q) => q.eq('messageId', args.messageId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Add to queue
    const emailId = await ctx.db.insert('emailQueue', {
      messageId: args.messageId,
      threadId: args.threadId,
      from: args.from,
      to: args.to,
      subject: args.subject,
      body: args.body,
      receivedAt: args.receivedAt,
      status: 'pending',
      priority: args.priority || 'medium',
      retryCount: 0,
      metadata: args.metadata,
    });

    return emailId;
  },
});

/**
 * Get pending emails to process
 */
export const getPendingEmails = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query('emailQueue')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .take(args.limit || 10);

    return emails;
  },
});

/**
 * Update email status
 */
export const updateEmailStatus = mutation({
  args: {
    emailId: v.id('emailQueue'),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    error: v.optional(v.string()),
    metadata: v.optional(v.object({
      intent: v.optional(v.string()),
      sentiment: v.optional(v.string()),
      urgency: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };

    if (args.status === 'completed' || args.status === 'failed') {
      updates.processedAt = Date.now();
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.metadata) {
      updates.metadata = args.metadata;
    }

    await ctx.db.patch(args.emailId, updates);
  },
});

/**
 * Increment retry count for failed email
 */
export const incrementRetry = mutation({
  args: {
    emailId: v.id('emailQueue'),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db.get(args.emailId);
    if (!email) return;

    await ctx.db.patch(args.emailId, {
      retryCount: email.retryCount + 1,
      status: 'pending',
    });
  },
});

/**
 * Log email activity for UI
 */
export const logActivity = mutation({
  args: {
    emailId: v.string(),
    type: v.union(
      v.literal('received'),
      v.literal('sent'),
      v.literal('analyzed'),
      v.literal('error')
    ),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    summary: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('emailActivity', {
      emailId: args.emailId,
      type: args.type,
      from: args.from,
      to: args.to,
      subject: args.subject,
      summary: args.summary,
      timestamp: Date.now(),
      metadata: args.metadata,
    });
  },
});

/**
 * Get recent email activity for UI
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query('emailActivity')
      .withIndex('by_timestamp')
      .order('desc')
      .take(args.limit || 50);

    return activities;
  },
});

/**
 * Get email by message ID
 */
export const getByMessageId = query({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const email = await ctx.db
      .query('emailQueue')
      .withIndex('by_message_id', (q) => q.eq('messageId', args.messageId))
      .first();

    return email;
  },
});

/**
 * Get emails by thread ID
 */
export const getByThreadId = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query('emailQueue')
      .withIndex('by_thread_id', (q) => q.eq('threadId', args.threadId))
      .collect();

    return emails;
  },
});

/**
 * Get queue statistics
 */
export const getQueueStats = query({
  args: {},
  handler: async (ctx) => {
    const allEmails = await ctx.db.query('emailQueue').collect();

    return {
      total: allEmails.length,
      pending: allEmails.filter((e) => e.status === 'pending').length,
      processing: allEmails.filter((e) => e.status === 'processing').length,
      completed: allEmails.filter((e) => e.status === 'completed').length,
      failed: allEmails.filter((e) => e.status === 'failed').length,
    };
  },
});
